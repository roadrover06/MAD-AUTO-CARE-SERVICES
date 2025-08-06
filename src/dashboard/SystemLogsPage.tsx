import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { ListAlt as ListAltIcon } from "@mui/icons-material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AppSidebar from "./AppSidebar";
import { format } from "date-fns";

interface SystemLog {
  id?: string;
  action: string;
  collection: string;
  deletedRecord?: any;
  deletedBy?: { name: string; role: string };
  deletedAt?: string;
  // Add other fields as needed
}

const SystemLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "systemLogs"));
        const logsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SystemLog[];
        // Sort by deletedAt descending
        logsData.sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
        setLogs(logsData);
      } catch (error) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Get role from localStorage
  const role = (localStorage.getItem("role") as "admin" | "cashier") || "cashier";

  // Helper to format details
  const formatDetails = (log: SystemLog) => {
    if (!log) return null;
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Action:</strong> {log.action}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Collection:</strong> {log.collection}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>User:</strong> {log.deletedBy?.name || "-"}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Role:</strong> {log.deletedBy?.role || "-"}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Date/Time:</strong> {log.deletedAt ? format(new Date(log.deletedAt), "MMM dd, yyyy hh:mm a") : "-"}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Details:</strong>
        </Typography>
        <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2, fontSize: 13, maxHeight: 300, overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {log.deletedRecord ? JSON.stringify(log.deletedRecord, null, 2) : "-"}
          </pre>
        </Box>
      </Box>
    );
  };

  return (
    <AppSidebar role={role}>
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1200, mx: "auto", width: "100%" }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2.5, sm: 4 },
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderRadius: 4,
            boxShadow: 3,
            background: "linear-gradient(135deg, #e0e0e0 0%, #fff 100%)",
          }}
        >
          <Avatar sx={{ bgcolor: "#ef5350", mr: 2, width: 56, height: 56 }}>
            <ListAltIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              System Logs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View all system actions such as deletions and other admin activities.
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={4} sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Logs
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Collection</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress color="primary" />
                      <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading Logs...</Typography>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No logs found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Chip label={log.action} color={log.action === "delete" ? "error" : "primary"} size="small" />
                      </TableCell>
                      <TableCell>{log.collection}</TableCell>
                      <TableCell>{log.deletedBy?.name || "-"}</TableCell>
                      <TableCell>{log.deletedBy?.role || "-"}</TableCell>
                      <TableCell>
                        {log.deletedAt
                          ? format(new Date(log.deletedAt), "MMM dd, yyyy hh:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => { setSelectedLog(log); setDialogOpen(true); }}
                          sx={{ borderRadius: 2, fontWeight: 600 }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Log Details</DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            {formatDetails(selectedLog as SystemLog)}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppSidebar>
  );
};

export default SystemLogsPage;
