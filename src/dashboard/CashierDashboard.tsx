import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";

interface CashierDashboardProps {
  onLogout?: () => void;
  onProfile?: () => void;
}

const CashierDashboard: React.FC<CashierDashboardProps> = ({ onLogout, onProfile }) => {
  const navigate = useNavigate();

  // Ensure onProfile and onLogout work with navigation
  const handleProfile = () => {
    if (onProfile) onProfile();
    navigate("/profile");
  };
  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <AppSidebar
      role="cashier"
      onLogout={handleLogoutClick}
      onProfile={handleProfile}
    >
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Cashier Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, Cashier! You have access to sales and transactions only.
          </Typography>
        </Paper>
        {/* Placeholders for cashier features */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Sales Transactions</Typography>
          <Typography variant="body2" color="text.secondary">
            Process and view sales transactions.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Daily Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            View your daily sales summary.
          </Typography>
        </Paper>
      </Box>
    </AppSidebar>
  );
};

export default CashierDashboard;

