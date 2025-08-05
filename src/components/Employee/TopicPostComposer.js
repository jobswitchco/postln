import { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  Stack,
  Snackbar,
} from "@mui/material";
import axios from "axios";

const TopicPostComposer = () => {
  const [open, setOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [publishSuccessSnackbar, setPublishSuccessSnackbar] = useState({
    open: false,
    message: "",
  });

  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";


  const handleMainDialogOpen = () => {
    setOpen(true);

    // 👇 Scroll up by 20% of the screen height
    setTimeout(() => {
      const scrollOffset = window.innerHeight * 0.2;
      window.scrollBy({ top: -scrollOffset, behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await axios.get(`${baseUrl}/get-user-name-image`, {
          withCredentials: true,
        });
        setProfilePicture(response.data.profilePicture);
      } catch (error) {
        console.error("Failed to fetch user name:", error);
        setProfilePicture("");
      }
    };

    fetchUserName();
  }, []);

  return (
    <>
      {/* Clickable Card */}
      <Box
        onClick={handleMainDialogOpen}
        sx={{
          borderRadius: 3,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          margin: "auto",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)",
          background: "#E8F9FF",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Avatar src={profilePicture} sx={{ width: 36, height: 38 }} />
          <Typography sx={{ fontSize: "16px", fontWeight: 500 }}>
            Start with an article
          </Typography>
        </Stack>

        <Typography sx={{ fontSize: "14px", color: "#3E3F5B" }}>
        Check out the articles below to get started. <br />
PostLn uses your voice, interests, and live trends to craft content that builds your authority.

        </Typography>
      </Box>

      {/* Optional Snackbar for feedback */}
      <Snackbar
        open={publishSuccessSnackbar.open}
        autoHideDuration={2000}
        onClose={() =>
          setPublishSuccessSnackbar({ open: false, message: "" })
        }
        message={publishSuccessSnackbar.message}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </>
  );
};

export default TopicPostComposer;
