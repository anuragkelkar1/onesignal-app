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

export default function ReservationForm() {
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [dateTime, setDateTime] = React.useState("");
  const [partySize, setPartySize] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [requests, setRequests] = React.useState([]);
  const [oneSignalUserId, setOneSignalUserId] = React.useState(null);

  // Capture OneSignal player ID once SDK is ready
  useEffect(() => {
    if (window.OneSignal) {
      window.OneSignal.push(() => {
        OneSignal.getUserId().then((id) => {
          setOneSignalUserId(id);
          console.log("OneSignal player ID:", id);
        });
      });
    }
  }, []);

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

  // Load requests whenever phone changes
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

    // 1) Save reservation
    const { error: insertError } = await supabase.from("reservations").insert([
      {
        phone,
        message,
        reservation_time: dateTime,
        party_size: partySize,
      },
    ]);
    if (insertError) {
      console.error("Insert error:", insertError);
      setLoading(false);
      return;
    }

    await fetchRequests();

    // 2) Trigger Edge Function, include OneSignal ID if available
    const payload = { phone, message, dateTime, partySize, notifyStaff };
    if (oneSignalUserId) {
      payload.oneSignalUserId = oneSignalUserId;
    }

    const { error: fnError } = await supabase.functions.invoke("reservation", {
      body: payload,
    });
    if (fnError) console.error("Function error:", fnError);

    // 3) Reset form fields (phone stays to continue fetching)
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
