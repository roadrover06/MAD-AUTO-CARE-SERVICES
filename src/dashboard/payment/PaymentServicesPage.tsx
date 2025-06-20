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
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  OutlinedInput,
  Divider,
  useMediaQuery
} from "@mui/material";
import AppSidebar from "../AppSidebar";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useTheme } from "@mui/material/styles";

const VARIETIES = [
  { key: "motor", label: "Motor" },
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
  { key: "xlarge", label: "X-Large" }
];

const PAYMENT_METHODS = [
  { key: "cash", label: "Cash" },
  { key: "gcash", label: "GCash" },
  { key: "card", label: "Card" },
  { key: "maya", label: "Maya" }
];

interface Service {
  id: string;
  name: string;
  description: string;
  prices: { [variety: string]: number };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface PaymentRecord {
  id?: string;
  customerName: string;
  carName: string;
  plateNumber: string;
  variety: string;
  serviceId: string;
  serviceName: string;
  price: number;
  cashier: string;
  cashierFullName?: string; // new
  employees: { id: string; name: string; commission: number }[];
  referrer?: { id: string; name: string; commission: number };
  createdAt: number;
  paid?: boolean; // new
  paymentMethod?: string; // add payment method
}

interface PaymentServicesPageProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
  cashierUsername: string;
}

const peso = (v: number) => `₱${v.toLocaleString()}`;

const PaymentServicesPage: React.FC<PaymentServicesPageProps> = ({
  onLogout,
  onProfile,
  firstName,
  lastName,
  cashierUsername
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [form, setForm] = useState({
    customerName: "",
    carName: "",
    plateNumber: "",
    variety: VARIETIES[0].key,
    serviceId: "",
    price: 0,
    employees: [] as { id: string; name: string; commission: number }[],
    commissions: {} as { [id: string]: number },
    referrerId: "",
    referrerCommission: 0,
    paymentMethod: PAYMENT_METHODS[0].key // default to cash
  });
  const [amountTendered, setAmountTendered] = useState<number | "">("");
  const [change, setChange] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchServices();
    fetchEmployees();
    fetchRecords();
  }, []);

  const fetchServices = async () => {
    const snapshot = await getDocs(collection(db, "services"));
    setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
  };

  const fetchEmployees = async () => {
    const snapshot = await getDocs(collection(db, "employees"));
    setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[]);
  };

  const fetchRecords = async () => {
    const snapshot = await getDocs(collection(db, "payments"));
    setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
  };

  const handleServiceChange = (serviceId: string, variety: string) => {
    const service = services.find(s => s.id === serviceId);
    const price = service ? (service.prices?.[variety] ?? 0) : 0;
    setForm(f => ({ ...f, serviceId, price }));
  };

  const handleVarietyChange = (variety: string) => {
    setForm(f => {
      const service = services.find(s => s.id === f.serviceId);
      const price = service ? (service.prices?.[variety] ?? 0) : 0;
      return { ...f, variety, price };
    });
  };

  // Handle employee selection (multi-select)
  const handleEmployeesChange = (event: any) => {
    const value = event.target.value as string[];
    setForm(f => ({
      ...f,
      employees: value.map(id => {
        const existing = f.employees.find(e => e.id === id);
        const emp = employees.find(e => e.id === id);
        return {
          id,
          name: emp ? `${emp.firstName} ${emp.lastName}` : "",
          commission: existing ? existing.commission : 0
        };
      }),
      commissions: value.reduce((acc, id) => {
        acc[id] = f.commissions[id] ?? 0;
        return acc;
      }, {} as { [id: string]: number })
    }));
  };

  // Handle commission input for each employee (percentage)
  const handleCommissionChange = (id: string, percent: number) => {
    setForm(f => ({
      ...f,
      commissions: { ...f.commissions, [id]: percent },
      employees: f.employees.map(e =>
        e.id === id
          ? { ...e, commission: Math.round((percent / 100) * f.price) }
          : e
      )
    }));
  };

  // Add referrer commission calculation
  const handleReferrerChange = (id: string) => {
    setForm(f => ({
      ...f,
      referrerId: id,
      referrerCommission: f.referrerCommission // keep commission value
    }));
  };
  const handleReferrerCommissionChange = (commission: number) => {
    setForm(f => ({
      ...f,
      referrerCommission: commission
    }));
  };

  // When price changes, update commission values
  useEffect(() => {
    setForm(f => ({
      ...f,
      employees: f.employees.map(e => ({
        ...e,
        commission: Math.round(((f.commissions[e.id] ?? 0) / 100) * f.price)
      }))
    }));
    // eslint-disable-next-line
  }, [form.price]);

  // Update change when amountTendered or form.price changes
  useEffect(() => {
    if (typeof amountTendered === "number" && !isNaN(amountTendered)) {
      setChange(amountTendered - form.price);
    } else {
      setChange(0);
    }
  }, [amountTendered, form.price]);

  // Fix: Only open processDialog, do not save payment yet
  const handleProcessPayment = () => {
    setProcessDialogOpen(true);
    setAmountTendered(form.price);
  };

  // Save payment only on confirm
  const handleAddPayment = async () => {
    try {
      const service = services.find(s => s.id === form.serviceId);
      if (!service) throw new Error("Service not found");
      const refEmp = employees.find(e => e.id === form.referrerId);
      const record: PaymentRecord = {
        customerName: form.customerName,
        carName: form.carName,
        plateNumber: form.plateNumber,
        variety: form.variety,
        serviceId: form.serviceId,
        serviceName: service.name,
        price: form.price,
        cashier: cashierUsername,
        cashierFullName: [firstName, lastName].filter(Boolean).join(" "),
        employees: form.employees,
        referrer: form.referrerId
          ? {
              id: form.referrerId,
              name: refEmp ? `${refEmp.firstName} ${refEmp.lastName}` : "",
              commission: Math.round((form.referrerCommission / 100) * form.price)
            }
          : undefined,
        createdAt: Date.now(),
        paid: true,
        paymentMethod: form.paymentMethod // save payment method
      };
      await addDoc(collection(db, "payments"), record);
      setSnackbar({ open: true, message: "Payment recorded!", severity: "success" });
      setAddDialogOpen(false);
      setProcessDialogOpen(false);
      setForm({
        customerName: "",
        carName: "",
        plateNumber: "",
        variety: VARIETIES[0].key,
        serviceId: "",
        price: 0,
        employees: [],
        commissions: {},
        referrerId: "",
        referrerCommission: 0,
        paymentMethod: PAYMENT_METHODS[0].key
      });
      setAmountTendered("");
      setChange(0);
      fetchRecords();
    } catch {
      setSnackbar({ open: true, message: "Failed to record payment", severity: "error" });
    }
  };

  // Quick amount buttons
  const quickAmounts = [100, 200, 300, 500, 1000];

  // Handle row click to show details
  const handleRowClick = (record: PaymentRecord) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  return (
    <AppSidebar
      role="cashier"
      firstName={firstName}
      lastName={lastName}
      onLogout={onLogout}
      onProfile={onProfile}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2, px: { xs: 1, sm: 2 } }}>
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2
        }}>
          <Typography variant="h5" fontWeight={700}>Payment & Services</Typography>
          <Button
            variant="contained"
            onClick={() => setAddDialogOpen(true)}
            sx={{ minWidth: 140 }}
          >
            New Service
          </Button>
        </Paper>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>Customer Name</TableCell>
                <TableCell>Car Name</TableCell>
                <TableCell>Plate #</TableCell>
                <TableCell>Variety</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Employees</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(r => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{
                    cursor: "pointer",
                    transition: "background 0.2s",
                    "&:hover": { background: theme.palette.action.hover }
                  }}
                  onClick={() => handleRowClick(r)}
                >
                  <TableCell>{r.customerName}</TableCell>
                  <TableCell>{r.carName}</TableCell>
                  <TableCell>{r.plateNumber || "-"}</TableCell>
                  <TableCell>{VARIETIES.find(v => v.key === r.variety)?.label || r.variety}</TableCell>
                  <TableCell>{r.serviceName}</TableCell>
                  <TableCell>{peso(r.price)}</TableCell>
                  <TableCell>
                    {r.cashierFullName
                      ? r.cashierFullName
                      : r.cashier}
                  </TableCell>
                  {/* Employees column: move stopPropagation to Chip */}
                  <TableCell>
                    {Array.isArray(r.employees) && r.employees.length > 0
                      ? r.employees.map(e => (
                          <Chip
                            key={e.id}
                            label={`${e.name} (${e.commission}₱, ${e.commission && r.price ? Math.round((e.commission / r.price) * 100) : 0}% )`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                            onClick={ev => ev.stopPropagation()}
                          />
                        ))
                      : "-"
                    }
                  </TableCell>
                  {/* Status column: move stopPropagation to Chip */}
                  <TableCell>
                    <Chip
                      label={r.paid ? "Paid" : "Unpaid"}
                      color={r.paid ? "success" : "warning"}
                      size="small"
                      onClick={ev => ev.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {PAYMENT_METHODS.find(m => m.key === r.paymentMethod)?.label || r.paymentMethod || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">No payment records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Add Service Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Service</DialogTitle>
        <DialogContent>
          {/* ...existing fields... */}
          <TextField
            label="Customer Name"
            fullWidth
            margin="normal"
            value={form.customerName}
            onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
          />
          <TextField
            label="Car Name"
            fullWidth
            margin="normal"
            value={form.carName}
            onChange={e => setForm(f => ({ ...f, carName: e.target.value }))}
          />
          <TextField
            label="Plate #"
            fullWidth
            margin="normal"
            value={form.plateNumber}
            onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
          />
          {/* Referrer selection */}
          <Select
            label="Referrer"
            fullWidth
            value={form.referrerId}
            onChange={e => handleReferrerChange(e.target.value)}
            displayEmpty
            sx={{ mt: 2 }}
            renderValue={selected => {
              if (!selected) return <span style={{ color: "#aaa" }}>Select Referrer (optional)</span>;
              const emp = employees.find(e => e.id === selected);
              return emp ? `${emp.firstName} ${emp.lastName}` : selected;
            }}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {employees.map(emp => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </MenuItem>
            ))}
          </Select>
          {form.referrerId && (
            <Box sx={{ mt: 2, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ minWidth: 120 }}>Referrer Commission (%)</Typography>
              <TextField
                label="Commission %"
                type="number"
                size="small"
                value={form.referrerCommission}
                onChange={ev => handleReferrerCommissionChange(Number(ev.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100 }
                }}
                sx={{ width: 100 }}
              />
              <Typography variant="body2" sx={{ minWidth: 80 }}>
                {peso(Math.round(((form.referrerCommission ?? 0) / 100) * form.price))}
              </Typography>
            </Box>
          )}
          {/* ...existing fields... */}
          <Select
            label="Variety"
            fullWidth
            value={form.variety}
            onChange={e => handleVarietyChange(e.target.value)}
            sx={{ mt: 2 }}
          >
            {VARIETIES.map(v => (
              <MenuItem key={v.key} value={v.key}>{v.label}</MenuItem>
            ))}
          </Select>
          <Select
            label="Service"
            fullWidth
            value={form.serviceId}
            onChange={e => handleServiceChange(e.target.value, form.variety)}
            sx={{ mt: 2 }}
          >
            {services
              .filter(s => typeof s.prices[form.variety] === "number" && s.prices[form.variety] > 0)
              .map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({peso(s.prices[form.variety])})
                </MenuItem>
              ))}
          </Select>
          <TextField
            label="Price"
            fullWidth
            margin="normal"
            value={form.price}
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              readOnly: true
            }}
            sx={{ mt: 2 }}
          />
          <Select
            multiple
            fullWidth
            value={form.employees.map(e => e.id)}
            onChange={handleEmployeesChange}
            input={<OutlinedInput label="Employees" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((id) => {
                  const emp = employees.find(e => e.id === id);
                  return (
                    <Chip
                      key={id}
                      label={emp ? `${emp.firstName} ${emp.lastName}` : id}
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
            sx={{ mt: 2 }}
          >
            {employees.map(emp => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </MenuItem>
            ))}
          </Select>
          {form.employees.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Labor Employee Commissions (%)</Typography>
              {form.employees.map(e => (
                <Box key={e.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography sx={{ minWidth: 120 }}>{e.name}</Typography>
                  <TextField
                    label="Commission %"
                    type="number"
                    size="small"
                    value={form.commissions[e.id] ?? 0}
                    onChange={ev => handleCommissionChange(e.id, Number(ev.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100 }
                    }}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 80 }}>
                    {peso(Math.round(((form.commissions[e.id] ?? 0) / 100) * form.price))}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {/* REMOVE Payment Method select from here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProcessPayment}
            disabled={!form.customerName || !form.carName || !form.plateNumber || !form.serviceId}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
      {/* Process Payment Dialog */}
      <Dialog open={processDialogOpen} onClose={() => setProcessDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          {/* ADD Payment Method select here */}
          <Select
            label="Payment Method"
            fullWidth
            value={form.paymentMethod}
            onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          >
            {PAYMENT_METHODS.map(m => (
              <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>
            ))}
          </Select>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Total Amount: <b>{peso(form.price)}</b>
          </Typography>
          <TextField
            label="Amount Tendered"
            fullWidth
            margin="normal"
            type="number"
            value={amountTendered}
            onChange={e => setAmountTendered(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>
            }}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {quickAmounts.map(q => (
              <Button
                key={q}
                variant="outlined"
                onClick={() => setAmountTendered(q)}
                sx={{ minWidth: 80 }}
              >
                {peso(q)}
              </Button>
            ))}
          </Box>
          <TextField
            label="Change"
            fullWidth
            margin="normal"
            value={change >= 0 ? peso(change) : "₱0"}
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              readOnly: true
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPayment}
            disabled={
              typeof amountTendered !== "number" ||
              isNaN(amountTendered) ||
              amountTendered < form.price
            }
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
      {/* Payment Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Payment & Service Details</DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 1, sm: 3 } }}>
          {selectedRecord && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                flexWrap: "wrap"
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Customer Name</Typography>
                  <Typography>{selectedRecord.customerName}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Car Name</Typography>
                  <Typography>{selectedRecord.carName}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Plate #</Typography>
                  <Typography>{selectedRecord.plateNumber || "-"}</Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                flexWrap: "wrap"
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Variety</Typography>
                  <Typography>
                    {VARIETIES.find(v => v.key === selectedRecord.variety)?.label || selectedRecord.variety}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Service</Typography>
                  <Typography>{selectedRecord.serviceName}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography>{peso(selectedRecord.price)}</Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                flexWrap: "wrap"
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Cashier</Typography>
                  <Typography>
                    {selectedRecord.cashierFullName
                      ? selectedRecord.cashierFullName
                      : selectedRecord.cashier}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography>{new Date(selectedRecord.createdAt).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedRecord.paid ? "Paid" : "Unpaid"}
                    color={selectedRecord.paid ? "success" : "warning"}
                    size="small"
                  />
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Employees & Commissions</Typography>
                {Array.isArray(selectedRecord.employees) && selectedRecord.employees.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedRecord.employees.map(e => (
                      <Chip
                        key={e.id}
                        label={`${e.name} (${peso(e.commission)})`}
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">-</Typography>
                )}
              </Box>
              {selectedRecord.referrer && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Referrer</Typography>
                  <Chip
                    label={`${selectedRecord.referrer.name} (${peso(selectedRecord.referrer.commission)})`}
                    size="small"
                    color="secondary"
                  />
                </Box>
              )}
              <Divider />
              <Box sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                flexWrap: "wrap"
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                  <Typography>
                    {PAYMENT_METHODS.find(m => m.key === selectedRecord.paymentMethod)?.label || selectedRecord.paymentMethod || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppSidebar>
  );
};

export default PaymentServicesPage;
