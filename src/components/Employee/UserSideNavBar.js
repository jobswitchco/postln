import React, { useState, useEffect }from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  Typography,
  Menu,
  Divider,
  MenuItem,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import {
  Close as CloseIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  SupportAgent as SupportAgentIcon,
} from "@mui/icons-material";
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import { deepOrange, blue, green, brown } from "@mui/material/colors";
import logo from "../../images/desk-logo.svg";
import axios from "axios";

const theme = createTheme({
  palette: {
    primary: { main: deepOrange[500] },
    secondary: { main: green[500] },
  },
});

const ResponsiveDrawer = ({ window }) => {
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";

  const [currentTime, setCurrentTime] = useState(new Date());



useEffect(() => {
  const interval = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    else if (hour < 18) return "Good afternoon";
    else return "Good evening";
  };

  setGreeting(getGreeting());

  const fetchUserName = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get-user-name-image`, {
        withCredentials: true,
      });
      setUserName(response.data.name);
      setProfilePicture(response.data.profilePicture);
    } catch (error) {
      console.error("Failed to fetch user name:", error);
      setUserName("");
    }
  };

  fetchUserName();
}, []);


const getHeaderTitle = () => {
  switch (location.pathname) {
    case "/professional/myposts":
      return {
        title: "My posts",
        subtitle: "Posts you've created with PostLn."
      };
    case "/professional/newsletters":
      return {
        title: "Newsletters",
        subtitle: "Your latest AI-crafted newsletters"
      };
    default:
      return {
        title: `${greeting}, ${userName}! 🖐️`,
        subtitle: null
      };
  }
};




  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawerWidth = 220;

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: '#F5F7F8' }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <img src={logo} alt="Logo" />
        {isSmallScreen && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        )}
      </Toolbar>

      

     <List sx={{ px: 1 }}>
      {/* Dashboard */}
      <ListItem disablePadding>
        <Link
          to="/professional/dashboard"
          style={{ textDecoration: "none", color: "black", width: "100%" }}
          onClick={handleDrawerToggle}
        >
          <ListItemButton
            selected={location.pathname === "/professional/dashboard"}
            sx={{
              backgroundColor: location.pathname === "/professional/dashboard" ? "#e3e3f3" : "transparent",
              borderRadius: "6px",
              py: 0.5,
            }}
          >
            <ListItemIcon>
              <SpaceDashboardOutlinedIcon
                sx={{
                  color: location.pathname === "/professional/dashboard" ? "#093FB4" : "#7F8CAA",
                  transition: "color 0.3s",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                sx: {
                  color: location.pathname === "/professional/dashboard" ? "#093FB4" : "#7F8CAA",
                  fontWeight: 400,
                },
              }}
            />
          </ListItemButton>
        </Link>
      </ListItem>

      {/* My Posts */}
      <ListItem disablePadding>
        <Link
          to="/professional/myposts"
          style={{ textDecoration: "none", color: "black", width: "100%" }}
          onClick={handleDrawerToggle}
        >
          <ListItemButton
            selected={location.pathname === "/professional/myposts"}
            sx={{
              backgroundColor: location.pathname === "/professional/myposts" ? "#e3e3f3" : "transparent",
              borderRadius: "6px",
              py: 0.5,
            }}
          >
            <ListItemIcon>
              <DateRangeOutlinedIcon
                sx={{
                  color: location.pathname === "/professional/myposts" ? "#093FB4" : "#7F8CAA",
                  transition: "color 0.3s",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="My posts"
              primaryTypographyProps={{
                sx: {
                  color: location.pathname === "/professional/myposts" ? "#093FB4" : "#7F8CAA",
                  fontWeight: 400,
                },
              }}
            />
          </ListItemButton>
        </Link>
      </ListItem>

      {isSmallScreen && (
           <ListItem disablePadding>
        <Link
          to="/professional/profile"
          style={{ textDecoration: "none", color: "black", width: "100%" }}
          onClick={handleDrawerToggle}
        >
          <ListItemButton
            selected={location.pathname === "/professional/profile"}
            sx={{
              backgroundColor: location.pathname === "/professional/profile" ? "#e3e3f3" : "transparent",
              borderRadius: "6px",
              py: 0.5,
            }}
          >
            <ListItemIcon>
              <AccountCircleOutlinedIcon
                sx={{
                  color: location.pathname === "/professional/profile" ? "#093FB4" : "#7F8CAA",
                  transition: "color 0.3s",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Profile"
              primaryTypographyProps={{
                sx: {
                  color: location.pathname === "/professional/profile" ? "#093FB4" : "#7F8CAA",
                  fontWeight: 400,
                },
              }}
            />
          </ListItemButton>
        </Link>
      </ListItem>
      )}

   
    </List>


      <Box />

      {/* <List>
        <ListItem disablePadding>
          <Link to="/professional/account/details" style={{ textDecoration: "none", color: "black", width: "100%" }} onClick={handleDrawerToggle}>
            <ListItemButton>
              <ListItemIcon><SettingsOutlinedIcon sx={{ color: brown[500] }} /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </Link>
        </ListItem>

        <ListItem disablePadding>
          <Link to="/professional/support" style={{ textDecoration: "none", color: "black", width: "100%" }} onClick={handleDrawerToggle}>
            <ListItemButton>
              <ListItemIcon><SupportAgentIcon sx={{ color: blue[500] }} /></ListItemIcon>
              <ListItemText primary="Support" />
            </ListItemButton>
          </Link>
        </ListItem>
      </List> */}
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", height: "100vh" }}>

        {/* Sidebar */}
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            anchor="left"
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { width: drawerWidth },
            }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { width: drawerWidth },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            maxWidth: { sm: `calc(100% - ${drawerWidth}px)` },
            pt: '62px',
            px: 2,
            overflow: 'auto'
           
          }}
        >
          {/* AppBar for all screen sizes */}
 <AppBar
  position="fixed"
  elevation={0}
  sx={{
    backgroundColor: "#F5F7F8",
    borderBottom: "1px solid #eee",
    zIndex: (theme) => theme.zIndex.drawer + 1,
    ml: { sm: `${drawerWidth}px` },
    width: { sm: `calc(100% - ${drawerWidth}px)` },
  }}
>
  <Toolbar
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: "64px",
      px: 3,
    }}
  >
    {/* Left: Greeting */}
{/* Left: Menu Icon (Mobile) + Greeting */}
<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
  {isSmallScreen && (
    <IconButton onClick={handleDrawerToggle}>
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="#000" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
      </svg>
    </IconButton>
  )}
  {(() => {
    const { title, subtitle } = getHeaderTitle();
    return (
      <Box>
        <Typography sx={{ fontSize: isSmallScreen ? '14px' : '16px', fontWeight: 500, color: '#111' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '14px', color: '#555', mt: 0.1 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    );
  })()}
</Box>




    {/* Right: Avatar with Menu */}
   {/* Right: Date-Time + Avatar */}
<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
   {!isSmallScreen && (
    <>

{location.pathname === "/professional/myposts" && (
  <Typography sx={{ fontSize: "14px", color: "#555", whiteSpace: "nowrap" }}>
    {`${currentTime.getDate().toString().padStart(2, "0")}-${currentTime.toLocaleString("en-US", {
      month: "short",
    }).toUpperCase()}-${currentTime.getFullYear()} ${currentTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${currentTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${currentTime
      .getSeconds()
      .toString()
      .padStart(2, "0")}`}
  </Typography>
)}

</> )}



 {!isSmallScreen && (
  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
    <img
      src={profilePicture}
      alt="Profile"
      style={{ width: 40, height: 40, borderRadius: "50%" }}
    />
  </IconButton>
)}


      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={500}>{userName}</Typography>
        </Box>

        <Divider />

          <Link
          to="/professional/profile"
          style={{ textDecoration: "none", color: "black", width: "100%" }}>
        <MenuItem>
        

          <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>
          </Link>


      
      </Menu>
    </Box>
  </Toolbar>
</AppBar>




          {/* Page Content */}
          <Box sx={{ px: 2, py: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

ResponsiveDrawer.propTypes = {
  window: PropTypes.func,
};

export default ResponsiveDrawer;
