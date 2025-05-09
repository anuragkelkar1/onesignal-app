// src/components/admin-dash/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    // request native notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // load existing reservations
    supabase
      .from("reservations")
      .select("*")
      .eq("adminResponse", false) // ← filter for adminResponse = true
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching reservations:", error);
        } else {
          setReservations(data);
        }
      });
    // realtime subscription for new reservations
    const channel = supabase
      .channel("reservations_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        ({ new: r }) => {
          setReservations((prev) => [r, ...prev]);
          if (Notification.permission === "granted") {
            new Notification("New Reservation", {
              body: `${r.phone}: ${r.message}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleConfirm = async (id, phone) => {
    // 1) mark as confirmed in Supabase
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ adminResponse: "true" })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to confirm reservation:", updateError);
      return;
    }

    // 2) send a push notification to the user via your Edge Function
    const { data: notifData, error: notifError } =
      await supabase.functions.invoke("reservation", {
        body: {
          phone,
          message: "Your order has been confirmed!",
          // optional flag if your function branches on notifyStaff
          notifyStaff: false,
        },
      });

    if (notifError) {
      console.error("Failed to send confirmation notification:", notifError);
    } else {
      console.log("Confirmation notification sent:", notifData);
    }

    // 3) remove from local list (or re-fetch)
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Box
      sx={{
        padding: 4,
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Incoming Reservations
      </Typography>

      {reservations.length === 0 ? (
        <Typography>No reservations yet.</Typography>
      ) : (
        <Box
          component="ul"
          sx={{
            mt: 2,
            width: "100%",
            maxWidth: 600,
            listStyle: "none",
            p: 0,
            m: 0,
          }}
        >
          {reservations.map((r) => (
            <Box
              component="li"
              key={r.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f5f5f5",
                p: 2,
                borderRadius: 1,
                mb: 2,
                boxShadow: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle1">
                  <strong>{r.phone}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.message}
                  <Typography variant="body2" color="text.secondary">
                    {new Date(r.reservation_time).toLocaleString()} — Party of{" "}
                    {r.party_size}
                  </Typography>
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleConfirm(r.id, r.phone)}
              >
                Confirm
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
