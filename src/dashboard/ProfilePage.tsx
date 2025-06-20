import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Alert,
  Fade,
  CircularProgress,
  Snackbar
} from "@mui/material";
import { AccountCircle, Lock, Person } from "@mui/icons-material";
import { saveCredentials } from "../firebase/firestoreHelpers";

interface ProfilePageProps {
  user: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack }) => {
  // Use user.firstName and user.lastName as initial values
  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Profile update (username, firstName, lastName)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // TODO: Replace this with actual Firestore update logic for user profile
      setTimeout(() => {
        setMessage("Profile updated successfully!");
        setLoading(false);
      }, 800);
    } catch (err) {
      setError("Failed to update profile.");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  // Password update (same logic as RegistrationForm)
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    if (newPassword !== confirmNewPassword) {
      setPwError("Passwords do not match.");
      setSnackbarOpen(true);
      setPwLoading(false);
      return;
    }
    try {
      // Use saveCredentials to update password (username, newPassword, role)
      await saveCredentials(username, newPassword, user.role);
      setPwMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPwError("Failed to change password.");
      setSnackbarOpen(true);
    } finally {
      setPwLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
      <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Edit Profile
        </Typography>
        <form onSubmit={handleProfileUpdate}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={e => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="First Name"
            variant="outlined"
            margin="normal"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Last Name"
            variant="outlined"
            margin="normal"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 2, mb: 1, py: 1.2, fontWeight: 600 }}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          {message && (
            <Fade in={!!message}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                {message}
              </Alert>
            </Fade>
          )}
        </form>
      </Paper>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Change Password
        </Typography>
        <form onSubmit={handlePasswordUpdate}>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={confirmNewPassword}
            onChange={e => setConfirmNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={pwLoading}
            sx={{ mt: 2, mb: 1, py: 1.2, fontWeight: 600 }}
            startIcon={pwLoading ? <CircularProgress size={20} /> : undefined}
          >
            {pwLoading ? "Changing..." : "Change Password"}
          </Button>
          {pwMessage && (
            <Fade in={!!pwMessage}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                {pwMessage}
              </Alert>
            </Fade>
          )}
        </form>
      </Paper>

      <Button
        variant="outlined"
        color="secondary"
        fullWidth
        sx={{ mt: 3 }}
        onClick={onBack}
      >
        Back to Dashboard
      </Button>

      <Snackbar
        open={!!error || !!pwError || snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={handleCloseSnackbar}
          sx={{
            width: "100%",
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: "#fff",
            color: "#d32f2f",
            "& .MuiAlert-icon": {
              color: "#d32f2f"
            }
          }}
        >
          {error || pwError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
