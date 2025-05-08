// src/components/card/card.jsx
import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { supabase } from "../../supabaseClient";

export default function ReservationForm() {
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const notifyStaff = true;
    // 1) Save to your reservations table
    const { error: insertError } = await supabase
      .from("reservations")
      .insert([{ phone, message }]);
    if (insertError) {
      console.error("Insert error:", insertError);
      setLoading(false);
      return;
    }

    // 2) Invoke Edge Function with phone + message
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "reservation",
      { body: { phone, message, notifyStaff } }
    );
    if (Notification.permission === "granted") {
      new Notification("Order Received", {
        body: "Thanks! Your order has been placed and is being processed.",
      });
    }
    if (fnError) {
      console.error("Function error:", fnError);
      // If you want the raw JSON response body, you can fetch it via fnError.message or inspect fnError
    } else {
      console.log("Function success:", fnData);
    }

    // 3) Reset form
    setPhone("");
    setMessage("");
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
              Send a Message
            </Typography>

            <TextField
              label="Phone Number"
              type="tel"
              required
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

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
              disabled={!phone || !message || loading}
            >
              {loading ? "Sending…" : "Send"}
            </Button>
          </CardActions>
        </form>
      </Card>
    </Box>
  );
}
