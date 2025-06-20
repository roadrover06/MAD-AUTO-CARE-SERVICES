import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import AppSidebar from "./AppSidebar";

interface AdminDashboardProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onProfile, firstName = "", lastName = "" }) => {
  return (
    <AppSidebar
      role="admin"
      onLogout={onLogout}
      onProfile={onProfile}
      firstName={firstName}
      lastName={lastName}
    >
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, Admin! You have full access to all features.
          </Typography>
        </Paper>
        {/* Placeholders for admin features */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">User Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Add, edit, or remove users.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Reports & Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            View sales, activity, and system reports.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure system settings and permissions.
          </Typography>
        </Paper>
        {/* Add more admin-only features here */}
      </Box>
    </AppSidebar>
  );
};

export default AdminDashboard;
