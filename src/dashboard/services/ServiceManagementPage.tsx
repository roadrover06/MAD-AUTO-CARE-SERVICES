import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import AppSidebar from "../AppSidebar";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const VARIETIES = [
  { key: "motor", label: "Motor", sub: ["Single Motor", "Big Bike"] },
  { key: "small", label: "Small", sub: ["Sedan/Hatchback"] },
  { key: "medium", label: "Medium", sub: ["AUV/MPV/Crossover"] },
  { key: "large", label: "Large", sub: ["SUV", "Pick-up", "Mid-size SUV"] },
  { key: "xlarge", label: "X-Large", sub: ["Van/Truck"] }
];

interface Service {
  id: string;
  name: string;
  description: string;
  prices: { [variety: string]: number };
}

interface ServiceManagementPageProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}

const peso = (v: number) => `₱${v.toLocaleString()}`;

const getServices = async (): Promise<Service[]> => {
  const snapshot = await getDocs(collection(db, "services"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
};
const addService = async (service: Omit<Service, "id">) => {
  await addDoc(collection(db, "services"), service);
};
const updateService = async (service: Service) => {
  await updateDoc(doc(db, "services", service.id), {
    name: service.name,
    description: service.description,
    prices: service.prices
  });
};
const deleteService = async (id: string) => {
  await deleteDoc(doc(db, "services", id));
};

const ServiceManagementPage: React.FC<ServiceManagementPageProps> = ({
  onLogout,
  onProfile,
  firstName,
  lastName
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<{ name: string; description: string; prices: { [variety: string]: number } }>({
    name: "",
    description: "",
    prices: VARIETIES.reduce((acc, v) => ({ ...acc, [v.key]: 0 }), {})
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [search, setSearch] = useState("");
  const [varietyTab, setVarietyTab] = useState(0); // 0 = All, 1... = per variety

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setServices(await getServices());
  };

  // Filter by search and variety
  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description.toLowerCase().includes(search.toLowerCase());
    if (varietyTab === 0) return matchesSearch;
    const varietyKey = VARIETIES[varietyTab - 1].key;
    // Only show if price for this variety is > 0
    return matchesSearch && service.prices && typeof service.prices[varietyKey] === "number" && service.prices[varietyKey] > 0;
  });

  const handleAddService = async () => {
    try {
      await addService(newService);
      setSnackbar({ open: true, message: "Service added!", severity: "success" });
      setAddDialogOpen(false);
      setNewService({ name: "", description: "", prices: VARIETIES.reduce((acc, v) => ({ ...acc, [v.key]: 0 }), {}) });
      fetchServices();
    } catch {
      setSnackbar({ open: true, message: "Failed to add service", severity: "error" });
    }
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;
    try {
      await updateService(selectedService);
      setSnackbar({ open: true, message: "Service updated!", severity: "success" });
      setEditDialogOpen(false);
      setSelectedService(null);
      fetchServices();
    } catch {
      setSnackbar({ open: true, message: "Failed to update service", severity: "error" });
    }
  };

  const handleDeleteService = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!selectedService) return;
    try {
      await deleteService(selectedService.id);
      setSnackbar({ open: true, message: "Service deleted!", severity: "success" });
      setDeleteDialogOpen(false);
      setSelectedService(null);
      fetchServices();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete service", severity: "error" });
    }
  };

  return (
    <AppSidebar
      role="admin"
      firstName={firstName}
      lastName={lastName}
      onLogout={onLogout}
      onProfile={onProfile}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: isSm ? 1 : 3, px: isSm ? 1 : 2, width: "100%" }}>
        <Paper
          sx={{
            p: isSm ? 2 : 3,
            mb: isSm ? 2 : 3,
            display: "flex",
            alignItems: isSm ? "stretch" : "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            boxShadow: 3,
            borderRadius: 3,
            background: "linear-gradient(90deg, #f8fafc 60%, #e3f2fd 100%)"
          }}
        >
          <Typography variant={isSm ? "h6" : "h5"} fontWeight={700} sx={{ mb: isSm ? 1 : 0 }}>
            Service Management
          </Typography>
          <Stack
            direction={isSm ? "column" : "row"}
            spacing={2}
            sx={{ width: isSm ? "100%" : "auto" }}
          >
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, background: "#f5f5f5" }
              }}
              sx={{
                minWidth: isSm ? "100%" : 220,
                flex: 1
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: 1,
                minWidth: isSm ? "100%" : 140
              }}
            >
              Add Service
            </Button>
          </Stack>
        </Paper>
        <Tabs
          value={varietyTab}
          onChange={(_, v) => setVarietyTab(v)}
          sx={{
            mb: 2,
            borderRadius: 2,
            background: "#fff",
            boxShadow: 1,
            minHeight: 44,
            ".MuiTab-root": { minHeight: 44, fontWeight: 600 }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Varieties" />
          {VARIETIES.map((v) => (
            <Tab key={v.key} label={v.label} />
          ))}
        </Tabs>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            boxShadow: 2,
            overflowX: "auto",
            maxWidth: "100%",
            minHeight: 200
          }}
        >
          <Table
            size={isSm ? "small" : "medium"}
            sx={{
              minWidth: 700,
              "& th, & td": {
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: isSm ? 90 : 180
              }
            }}
            stickyHeader
          >
            <TableHead>
              <TableRow sx={{ background: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, background: "#f5f5f5" }}>Service Name</TableCell>
                <TableCell sx={{ fontWeight: 700, background: "#f5f5f5" }}>Description</TableCell>
                {VARIETIES.map(v => (
                  <TableCell key={v.key} align="center" sx={{ fontWeight: 700, background: "#f5f5f5" }}>
                    {v.label}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {v.sub.join(", ")}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700, background: "#f5f5f5" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices.map(service => (
                <TableRow
                  key={service.id}
                  hover
                  sx={{
                    transition: "background 0.2s",
                    "&:hover": { background: "#e3f2fd" }
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, maxWidth: 160 }}>
                    <Typography noWrap title={service.name}>{service.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      title={service.description}
                    >
                      {service.description}
                    </Typography>
                  </TableCell>
                  {VARIETIES.map(v => (
                    <TableCell key={v.key} align="center">
                      <Typography fontWeight={500}>
                        {peso(service.prices?.[v.key] ?? 0)}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditService(service)}
                        sx={{
                          "&:hover": { background: "#e3f2fd" }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteService(service)}
                        sx={{
                          "&:hover": { background: "#ffebee" }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={VARIETIES.length + 3} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No services found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Add Service Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isSm}
        PaperProps={{
          sx: { borderRadius: isSm ? 0 : 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Add Service</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Service Name"
              fullWidth
              variant="outlined"
              margin="dense"
              value={newService.name}
              onChange={e => setNewService({ ...newService, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              variant="outlined"
              margin="dense"
              multiline
              minRows={2}
              value={newService.description}
              onChange={e => setNewService({ ...newService, description: e.target.value })}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {VARIETIES.map(v => (
                <TextField
                  key={v.key}
                  label={v.label}
                  type="number"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  value={newService.prices[v.key] ?? 0}
                  onChange={e =>
                    setNewService({
                      ...newService,
                      prices: { ...newService.prices, [v.key]: Number(e.target.value) }
                    })
                  }
                  sx={{ flex: "1 1 120px", minWidth: 100 }}
                  margin="dense"
                />
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddService} sx={{ borderRadius: 2 }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit Service Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isSm}
        PaperProps={{
          sx: { borderRadius: isSm ? 0 : 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Edit Service</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Service Name"
              fullWidth
              variant="outlined"
              margin="dense"
              value={selectedService?.name || ""}
              onChange={e =>
                setSelectedService(selectedService
                  ? { ...selectedService, name: e.target.value }
                  : null
                )
              }
            />
            <TextField
              label="Description"
              fullWidth
              variant="outlined"
              margin="dense"
              multiline
              minRows={2}
              value={selectedService?.description || ""}
              onChange={e =>
                setSelectedService(selectedService
                  ? { ...selectedService, description: e.target.value }
                  : null
                )
              }
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {VARIETIES.map(v => (
                <TextField
                  key={v.key}
                  label={v.label}
                  type="number"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  value={selectedService?.prices?.[v.key] ?? 0}
                  onChange={e =>
                    setSelectedService(selectedService
                      ? {
                          ...selectedService,
                          prices: { ...selectedService.prices, [v.key]: Number(e.target.value) }
                        }
                      : null
                    )
                  }
                  sx={{ flex: "1 1 120px", minWidth: 100 }}
                  margin="dense"
                />
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateService} sx={{ borderRadius: 2 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Service Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isSm}
        PaperProps={{
          sx: { borderRadius: isSm ? 0 : 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 1 }}>
          <Typography>
            Are you sure you want to delete service <b>{selectedService?.name}</b>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDeleteService} sx={{ borderRadius: 2 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppSidebar>
  );
};

export default ServiceManagementPage;
