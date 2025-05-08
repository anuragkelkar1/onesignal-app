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
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validatePhone(phone);
    if (phoneError) return;
    setLoading(true);

    const notifyStaff = true;

    // 1) Save reservation
    const { data, error: insertError } = await supabase
      .from("reservations")
      .insert([
        {
          phone,
          message,
          reservation_time: dateTime,
          party_size: partySize,
        },
      ])
      .select();
    if (insertError) {
      console.error("Insert error:", insertError);
      setLoading(false);
      return;
    }

    const newReq = data[0];
    // add to local requests list
    setRequests((prev) => [...prev, newReq]);

    // 2) Trigger Edge Function
    const { error: fnError } = await supabase.functions.invoke("reservation", {
      body: { phone, message, dateTime, partySize, notifyStaff },
    });
    if (Notification.permission === "granted") {
      new Notification("Reservation Received", {
        body: "Thanks! Your reservation has been placed.",
      });
    }
    if (fnError) console.error("Function error:", fnError);

    // 3) Reset form
    setPhone("");
    setPhoneError("");
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

            <TextField
              label="Date & Time"
              type="datetime-local"
              required
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
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

      {/* User's requests section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Your Requests</Typography>
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
                <Typography>Status: {r.admin_response || "Pending"}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
