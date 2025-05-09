// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

import Header from "./components/Header/Header";
import AdminDashboard from "./components/admin-dash/AdminDashboard.jsx";
import ReservationForm from "./components/card/card";

function Home({ onSuccess }) {
  return (
    <Box
      sx={{
        mx: "auto",
        // width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100dvh", // dynamic vh handles mobile correctly
        px: 2,
      }}
    >
      <ReservationForm onSuccess={onSuccess}>
        <Typography>
          This is a Vite + React application using Material UI components.
        </Typography>
      </ReservationForm>
    </Box>
  );
}

export default function App() {
  // 1️⃣ Request browser‐notification permission once on app load
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 2️⃣ Callback to fire a native notification on successful order
  const notifyUser = () => {
    if (Notification.permission === "granted") {
      new Notification("Order Received", {
        body: "Thanks! Your order has been placed and is being processed.",
      });
    }
  };

  return (
    <>
      <CssBaseline />
      <Header />
      <Toolbar />

      <Container maxWidth={false} disableGutters sx={{ mt: 2, mb: 4 }}>
        {/* <Box sx={{ borderBottom: "1px solid #ddd", p: 2 }}>
          <nav>
            <Link to="/" style={{ marginRight: 16 }}>
              Home
            </Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </Box> */}

        <Routes>
          <Route path="/" element={<Home onSuccess={notifyUser} />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Container>
    </>
  );
}
