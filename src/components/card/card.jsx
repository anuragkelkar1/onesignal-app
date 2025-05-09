// src/components/card/ReservationForm.jsx

import React, { useEffect } from "react";
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function ReservationForm() {
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [dateTime, setDateTime] = React.useState("");
  const [partySize, setPartySize] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [requests, setRequests] = React.useState([]);

  const validatePhone = (val) => {
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(val)) {
      setPhoneError("Enter a valid phone number (10–15 digits)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const fetchRequests = async () => {
    if (!validatePhone(phone)) return;
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching reservations:", error);
    else setRequests(data);
  };

  useEffect(() => {
    if (phone && validatePhone(phone)) {
      fetchRequests();
    } else {
      setRequests([]);
    }
  }, [phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone(phone)) return;
    setLoading(true);

    const notifyStaff = true;
    const { error: insertError } = await supabase
      .from("reservations")
      .insert([
        { phone, message, reservation_time: dateTime, party_size: partySize },
      ]);
    if (insertError) {
      console.error("Insert error:", insertError);
      setLoading(false);
      return;
    }

    await fetchRequests();

    const { error: fnError } = await supabase.functions.invoke("reservation", {
      body: { phone, message, dateTime, partySize, notifyStaff },
    });
    // if (Notification.permission === "granted") {
    // }
    if (fnError) console.error("Function error:", fnError);

    setMessage("");
    setDateTime("");
    setPartySize("");
    setLoading(false);
  };

  return (
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

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Date & Time"
                value={dateTime ? dayjs(dateTime) : null}
                onChange={(newValue) => {
                  if (newValue) setDateTime(newValue.toISOString()); // store ISO string
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>

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
                !dateTime ||
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

      {/* User's Requests */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h6">Your Requests</Typography>
        <Button variant="text" onClick={fetchRequests} disabled={!phone}>
          Refresh
        </Button>
        {requests.length === 0 ? (
          <Typography>No reservation requests yet.</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0 }}>
            {requests.map((r) => (
              <Box
                component="li"
                key={r.id}
                sx={{ mb: 2, p: 2, border: "1px solid #ccc", borderRadius: 1 }}
              >
                <Typography>
                  {new Date(r.reservation_time).toLocaleString()} — Party of{" "}
                  {r.party_size}
                </Typography>
                <Typography>
                  Status: {r.adminResponse ? "Confirmed" : "Pending"}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
