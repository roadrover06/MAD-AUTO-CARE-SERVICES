import React, { useState, useEffect, ReactNode } from "react";
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Typography,
  CssBaseline,
  ListItemButton,
  Menu,
  MenuItem as MuiMenuItem,
  Avatar
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft,
  Dashboard,
  People,
  Settings,
  Receipt,
  BarChart,
  Logout,
  PointOfSale,
  AccountCircle,
  ExpandMore,
  Group as GroupIcon,
  Build as BuildIcon,
  Payment as PaymentIcon
} from "@mui/icons-material";
import logo from '../assets/logos/carwash-logo.png';
import { useNavigate } from "react-router-dom";

const drawerWidth = 220;
const collapsedWidth = 64;

interface AppSidebarProps {
  role: "admin" | "cashier";
  firstName?: string;
  lastName?: string;
  onLogout?: () => void;
  onProfile?: () => void;
  children?: ReactNode;
}

// Organize menu into sections for better UX
const adminMenu = [
  {
    section: "Main",
    items: [
      { text: "Dashboard", icon: <Dashboard /> },
      { text: "Reports & Analytics", icon: <BarChart /> },
      { text: "Sales Transactions", icon: <Receipt /> }
    ]
  },
  {
    section: "Management",
    items: [
      { text: "User Management", icon: <People /> },
      { text: "Employee Management", icon: <GroupIcon /> },
      { text: "Service Management", icon: <BuildIcon /> }
    ]
  },
  {
    section: "Settings",
    items: [
      { text: "Settings", icon: <Settings /> }
    ]
  }
];

const cashierMenu = [
  {
    section: "Main",
    items: [
      { text: "Dashboard", icon: <Dashboard /> },
      { text: "Payment & Services", icon: <PaymentIcon /> },
      { text: "Sales Transactions", icon: <PointOfSale /> },
      { text: "Daily Summary", icon: <Receipt /> }
    ]
  }
];

const SIDEBAR_PREF_KEY = "sidebarOpen";

const AppSidebar: React.FC<AppSidebarProps> = ({ 
  role, 
  firstName: propFirstName = '', 
  lastName: propLastName = '', 
  onLogout, 
  onProfile, 
  children 
}) => {
  // Persist sidebar open/close state in localStorage
  const [open, setOpen] = useState(() => {
    const pref = localStorage.getItem(SIDEBAR_PREF_KEY);
    return pref === null ? true : pref === "true";
  });
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  // Add state for user info from localStorage
  const [userInfo, setUserInfo] = useState<{firstName: string, lastName: string}>({
    firstName: propFirstName,
    lastName: propLastName
  });

  // On mount and when sidebar opens, read userInfo from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserInfo({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || ""
        });
      } catch {
        setUserInfo({ firstName: propFirstName, lastName: propLastName });
      }
    } else {
      setUserInfo({ firstName: propFirstName, lastName: propLastName });
    }
    // eslint-disable-next-line
  }, [propFirstName, propLastName, role]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_PREF_KEY, String(open));
  }, [open]);

  const menu = role === "admin" ? adminMenu : cashierMenu;

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    handleCloseMenu();
    if (onProfile) onProfile();
  };

  const handleLogoutClick = () => {
    handleCloseMenu();
    if (onLogout) onLogout();
  };

  // Handle menu navigation
  const handleMenuClick = (item: { text: string }) => {
    if (role === "admin" && item.text === "User Management") {
      navigate("/admin/users");
    }
    if (role === "admin" && item.text === "Employee Management") {
      navigate("/admin/employees");
    }
    if (role === "admin" && item.text === "Service Management") {
      navigate("/admin/services");
    }
    if (role === "cashier" && item.text === "Payment & Services") {
      navigate("/cashier/payment-services");
    }
    // Add more navigation as needed for other menu items
  };

  // Use userInfo from state, fallback to props if not available
  const firstName = userInfo.firstName || propFirstName;
  const lastName = userInfo.lastName || propLastName;

  // Generate user initials
  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // Improved Collapse Button: icon only, no background/border/shadow
  const CollapseButton = (
    <IconButton
      onClick={() => setOpen((prev) => !prev)}
      sx={{
        position: "absolute",
        top: 18,
        left: open ? drawerWidth + 8 : collapsedWidth + 8,
        zIndex: 1301,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        transition: "left 0.3s",
        color: "#444",
        "&:hover": {
          background: "rgba(0,0,0,0.04)"
        }
      }}
      size="large"
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
    >
      {open ? <ChevronLeft /> : <MenuIcon />}
    </IconButton>
  );

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", position: "relative" }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            overflowX: 'hidden',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            background: "#fff",
            borderRight: "1px solid #eee",
            display: "flex",
            flexDirection: "column"
          },
        }}
        PaperProps={{
          style: { overflowY: "hidden" } // Remove vertical scroll from sidebar
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "flex-start" : "center",
            p: open ? "20px 24px 12px 24px" : "20px 12px 12px 12px",
            borderBottom: "1px solid #eee",
            minHeight: 72
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              height: 40,
              width: open ? "auto" : 40,
              borderRadius: 1,
              bgcolor: "#fff",
              p: 0.5,
              objectFit: "contain",
              transition: "width 0.3s"
            }}
          />
          {open && (
            <Typography variant="h6" sx={{ ml: 2, fontWeight: 700, color: "#1976d2", letterSpacing: 1 }}>
              MAD
            </Typography>
          )}
        </Box>

        {/* Main Menu */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", pt: 1 }}>
          {menu.map((section, idx) => (
            <Box key={section.section}>
              {open && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#888",
                    fontWeight: 700,
                    letterSpacing: 1,
                    pl: 3,
                    pt: idx === 0 ? 0 : 2,
                    pb: 0.5,
                    display: "block"
                  }}
                >
                  {section.section}
                </Typography>
              )}
              <List sx={{ py: 0 }}>
                {section.items.map((item) => (
                  <ListItemButton
                    key={item.text}
                    sx={{
                      minHeight: 44,
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 3 : 1.5,
                      borderRadius: 2,
                      my: 0.5,
                      transition: "background 0.2s",
                      "&:hover": {
                        background: "#f5f5f5"
                      }
                    }}
                    onClick={() => handleMenuClick(item)}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: "#1976d2"
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        opacity: open ? 1 : 0,
                        transition: "opacity 0.2s"
                      }}
                      primaryTypographyProps={{
                        fontWeight: 500,
                        fontSize: 15
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
              {idx < menu.length - 1 && (
                <Divider sx={{ mx: open ? 2 : 1.5, my: 1 }} />
              )}
            </Box>
          ))}
        </Box>

        {/* User Menu Section */}
        <Box
          sx={{
            p: open ? 2 : 1,
            borderTop: "1px solid #eee",
            display: "flex",
            flexDirection: open ? "row" : "column",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            minHeight: 70,
            background: "#fafbfc"
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: open ? "100%" : "auto"
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#1976d2",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                mr: open ? 2 : 0,
                cursor: "pointer"
              }}
              onClick={handleUserMenuOpen}
            >
              {userInitials}
            </Avatar>
            {open && (
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {firstName} {lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {role === "admin" ? "Admin" : "Cashier"}
                </Typography>
              </Box>
            )}
          </Box>
          {open && (
            <IconButton size="small" onClick={handleUserMenuOpen} sx={{ ml: 1 }}>
              <ExpandMore />
            </IconButton>
          )}
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <MuiMenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MuiMenuItem>
          <Divider />
          <MuiMenuItem onClick={handleLogoutClick}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MuiMenuItem>
        </Menu>
      </Drawer>

      {/* Collapse Button in Content */}
      {CollapseButton}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          width: `calc(100vw - ${open ? drawerWidth : collapsedWidth}px)`,
          transition: (theme) => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          background: "#f6f8fa",
          minHeight: "100vh"
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppSidebar;