import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Chip, 
  Divider, 
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery
} from "@mui/material";
import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { 
  MonetizationOn as MonetizationOnIcon,
  Build as BuildIcon,
  Group as GroupIcon,
  EmojiEvents as EmojiEventsIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface AdminDashboardProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
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
  cashierFullName?: string;
  employees: { id: string; name: string; commission: number }[];
  referrer?: { id: string; name: string; commission: number };
  createdAt: number;
  paid?: boolean;
  paymentMethod?: string;
  amountTendered?: number;
  change?: number;
}

interface LoyaltyCustomer {
  id?: string;
  name: string;
  cars: { carName: string; plateNumber: string }[];
  points?: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  prices: { [variety: string]: number };
}

const peso = (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const StatCard = ({ 
  icon, 
  title, 
  value, 
  loading,
  color = "primary"
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  loading: boolean;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error";
}) => (
  <Card 
    component={motion.div}
    whileHover={{ y: -4 }}
    sx={{ 
      flex: "1 1 240px", 
      minWidth: 240,
      borderRadius: 3,
      boxShadow: 2,
      transition: 'transform 0.2s',
      '&:hover': {
        boxShadow: 4,
      }
    }}
  >
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.light`,
          color: `${color}.dark`,
          borderRadius: 2,
          p: 2,
          minWidth: 56,
          minHeight: 56
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={100} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={700} color={`${color}.main`}>
            {value}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, 
  onProfile, 
  firstName = "", 
  lastName = "" 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [paymentsSnap, loyaltySnap, employeesSnap, servicesSnap] = await Promise.all([
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "loyalty_customers")),
          getDocs(collection(db, "employees")),
          getDocs(collection(db, "services"))
        ]);
        setPayments(paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
        setLoyaltyCustomers(loyaltySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LoyaltyCustomer[]);
        setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[]);
        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Overall sales (paid only)
  const allPaid = payments.filter(p => p.paid);
  const overallSales = allPaid.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);

  // Number of services
  const totalServices = services.length;

  // Loyalty customers count
  const totalLoyaltyCustomers = loyaltyCustomers.length;

  // Employees count
  const totalEmployees = employees.length;

  // Most availed services (all time, top 3)
  const serviceCount: { [serviceName: string]: number } = {};
  allPaid.forEach(p => {
    if (p.serviceName) {
      serviceCount[p.serviceName] = (serviceCount[p.serviceName] || 0) + 1;
    }
  });
  const mostAvailed = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top customers by number of paid records (top 3)
  const customerCount: { [customerName: string]: number } = {};
  allPaid.forEach(p => {
    if (p.customerName) {
      customerCount[p.customerName] = (customerCount[p.customerName] || 0) + 1;
    }
  });
  const topCustomers = Object.entries(customerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <AppSidebar
      role="admin"
      onLogout={onLogout}
      onProfile={onProfile}
      firstName={firstName}
      lastName={lastName}
    >
      <Box sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        maxWidth: 1400, 
        mx: "auto",
        width: '100%'
      }}>
        {/* Header */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'common.white',
            boxShadow: 3
          }}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Welcome back, {firstName}! Here's what's happening with your business today.
          </Typography>
        </Paper>

        {/* Dashboard Stats */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 4,
            justifyContent: { xs: "center", md: "flex-start" }
          }}
        >
          <StatCard
            icon={<MonetizationOnIcon sx={{ fontSize: 28 }} />}
            title="Overall Sales"
            value={peso(overallSales)}
            loading={loading}
            color="success"
          />
          <StatCard
            icon={<BuildIcon sx={{ fontSize: 28 }} />}
            title="Services"
            value={totalServices}
            loading={loading}
            color="info"
          />
          <StatCard
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            title="Loyalty Customers"
            value={totalLoyaltyCustomers}
            loading={loading}
            color="warning"
          />
          <StatCard
            icon={<GroupIcon sx={{ fontSize: 28 }} />}
            title="Employees"
            value={totalEmployees}
            loading={loading}
            color="secondary"
          />
        </Box>

        {/* Analytics Sections */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
          {/* Most Availed Services */}
          <Card 
            sx={{ 
              flex: 1,
              borderRadius: 3,
              boxShadow: 2,
              minWidth: 300
            }}
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="warning" sx={{ mr: 1.5, fontSize: 32 }} />
                <Typography variant="h6" fontWeight={700}>
                  Most Availed Services
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {loading ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" width={120} height={40} />
                  ))}
                </Box>
              ) : mostAvailed.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No services availed yet.
                </Typography>
              ) : (
                <Box sx={{ 
                  display: "flex", 
                  gap: 2, 
                  flexWrap: "wrap",
                  '& .MuiChip-root': {
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    fontSize: 15
                  }
                }}>
                  {mostAvailed.map(([service, count], idx) => (
                    <Chip
                      key={service}
                      label={`${service} (${count})`}
                      color={idx === 0 ? "warning" : idx === 1 ? "info" : "default"}
                      icon={<EmojiEventsIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card 
            sx={{ 
              flex: 1,
              borderRadius: 3,
              boxShadow: 2,
              minWidth: 300
            }}
            component={motion.div}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon color="primary" sx={{ mr: 1.5, fontSize: 32 }} />
                <Typography variant="h6" fontWeight={700}>
                  Top Customers
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {loading ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" width={120} height={40} />
                  ))}
                </Box>
              ) : topCustomers.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No customer records yet.
                </Typography>
              ) : (
                <Box sx={{ 
                  display: "flex", 
                  gap: 2, 
                  flexWrap: "wrap",
                  '& .MuiChip-root': {
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    fontSize: 15
                  }
                }}>
                  {topCustomers.map(([customer, count], idx) => (
                    <Chip
                      key={customer}
                      label={`${customer} (${count})`}
                      color={idx === 0 ? "primary" : idx === 1 ? "info" : "default"}
                      icon={<PersonIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </AppSidebar>
  );
};

export default AdminDashboard;