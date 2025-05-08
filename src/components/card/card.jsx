// src/components/card/ReservationForm.jsx

import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { supabase } from "../../supabaseClient";

// new imports for date & time pickers
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

export default function ReservationForm() {
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [date, setDate] = React.useState(null);
  const [time, setTime] = React.useState(null);
  const [partySize, setPartySize] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const validatePhone = (val) => {
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(val)) {
      setPhoneError("Enter a valid phone number (10–15 digits)");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validatePhone(phone);
    if (phoneError || !date || !time) return;
    setLoading(true);

    // combine date + time into a single ISO string
    const dt = new Date(date);
    dt.setHours(time.getHours(), time.getMinutes(), 0, 0);
    const reservationDateTime = dt.toISOString();

    const notifyStaff = true;

    // 1) Save reservation
    const { error: insertError } = await supabase.from("reservations").insert([
      {
        phone,
        message,
        reservation_time: reservationDateTime,
        party_size: partySize,
      },
    ]);
    if (insertError) {
      console.error("Insert error:", insertError);
      setLoading(false);
      return;
    }

    // 2) Trigger Edge Function
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "reservation",
      {
        body: {
          phone,
          message,
          dateTime: reservationDateTime,
          partySize,
          notifyStaff,
        },
      }
    );
    if (Notification.permission === "granted") {
      new Notification("Reservation Received", {
        body: "Thanks! Your reservation has been placed.",
      });
    }
    if (fnError) {
      console.error("Function error:", fnError);
    } else {
      console.log("Function success:", fnData);
    }

    // 3) Reset form
    setPhone("");
    setPhoneError("");
    setMessage("");
    setDate(null);
    setTime(null);
    setPartySize("");
    setLoading(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minWidth: 400, mx: "auto" }}>
        <Card variant="outlined">
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Typography
                gutterBottom
                sx={{ color: "text.secondary", fontSize: 14 }}
              >
                Make Your Reservation
              </Typography>

              <TextField
                label="Phone Number"
                type="tel"
                required
                fullWidth
                margin="normal"
                value={phone}
                error={!!phoneError}
                helperText={phoneError}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) validatePhone(e.target.value);
                }}
                onBlur={(e) => validatePhone(e.target.value)}
              />

              <DatePicker
                label="Reservation Date"
                value={date}
                onChange={(newDate) => setDate(newDate)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" required />
                )}
              />

              <TimePicker
                label="Reservation Time"
                value={time}
                onChange={(newTime) => setTime(newTime)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" required />
                )}
              />

              <FormControl fullWidth margin="normal" required>
                <InputLabel id="party-size-label">Party Size</InputLabel>
                <Select
                  labelId="party-size-label"
                  label="Party Size"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Message"
                required
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </CardContent>

            <CardActions>
              <Button
                type="submit"
                size="small"
                sx={{ mx: "auto" }}
                disabled={
                  !phone ||
                  !!phoneError ||
                  !date ||
                  !time ||
                  !partySize ||
                  !message ||
                  loading
                }
              >
                {loading ? "Sending…" : "Reserve"}
              </Button>
            </CardActions>
          </form>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
