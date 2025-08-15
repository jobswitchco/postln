import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Snackbar,
  Alert,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Stack,
  useMediaQuery,
  useTheme
} from "@mui/material";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LinkedInStyleAnalyzer = () => {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";
 const [urlError, setUrlError] = useState("");
  const navigate = useNavigate();
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
 const [minutesLeft, setMinutesLeft] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get(baseUrl + "/are-posts-analyzed", {
        withCredentials: true,
      });

      if (res.data.success && res.data.model_ready) {
        navigate("/professional/dashboard");
      } else if (res.data.success && res.data.model_started) {
        setShowLoadingAnimation(true);
        setMinutesLeft(res.data.minutes_left); // ← ✅ set time left
      } else {
        setShowLoadingAnimation(false);
      }
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  fetchData();

  // Poll every 1 minute for better UX
  const interval = setInterval(fetchData, 60000); // every minute

  return () => clearInterval(interval);
}, []);
 

const handleAnalyze = async () => {
  // Reset previous error
  setUrlError("");

  // Basic LinkedIn URL validation
  if (!linkedinUrl.startsWith("https://www.linkedin.com/")) {
    setUrlError("Invalid URL. Must start with https://www.linkedin.com/");
    return;
  }

  setLoading(true);
  try {
    const res = await axios.post(baseUrl + "/analyze-writing-style", {
      linkedinUrl,
    }, { withCredentials: true });

    if (res.data.success) {
      setToastOpen(true);
      navigate("/professional/dashboard");
    } else {
      toast.error("Network Error! Please try again.");
    }
  } catch (error) {
    console.error("Style analysis failed:", error);
  } finally {
    setLoading(false);
  }
};

  const SkeletonCard = () => (
    <Card
      sx={{
        width: 280,
        height: 360,
        mx: 1,
        flexShrink: 0,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: "#fff",
      }}
    >
      <CardContent>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width="60%" sx={{ my: 1 }} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="85%" />
        <Skeleton variant="rectangular" height={160} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ px: isMobile ? 2 : 4, py: 4 }}>
      <Typography
        sx={{
          maxWidth: 800,
          mx: "auto",
          mt: 2,
          mb: 4,
          textAlign: "center",
          fontSize: isMobile ? "14px" : "16px",
          color: "text.secondary",
        }}
      >
        Crafting your LinkedIn co-pilot ☕
We analyze your posts to learn your writing style. 
This takes up to <strong>30 minutes</strong>. Sit back, relax, and we'll notify you when it's ready!

       </Typography>

       {minutesLeft !== null && (
  <Typography variant="subtitle2" sx={{ mt: 1, textAlign : 'center' }}>
    ⏳ Approx. {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} remaining...
  </Typography>
)}

      {(loading || showLoadingAnimation) ? (
        <>
          {/* Loader */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mt: 4
            }}
          >
            <Typography
              sx={{
                fontSize : isMobile ? '18px' : '20px',
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                mb: 2
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 20,
                  height: 20,
                  border: "3px solid #ccc",
                  borderTop: "3px solid #06923E",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  mr: 1
                }}
              />
              Analyzing your LinkedIn posts...
            </Typography>

            <Button
              onClick={() => window.location.reload()}
              variant="outlined"
              color="primary"
              sx={{ textTransform: 'none', color: '#000000' }}
            >
              🔄 Refresh Status
            </Button>
          </Box>

          {/* Skeleton Cards */}
          <Box
            sx={{
              mt: 4,
              width: "100%",
              overflow: "hidden",
              position: "relative",
              height: 400,
              bgcolor: "#f5f5f5",
            }}
          >
            <Box
              sx={{
                display: "flex",
                width: "max-content",
                animation: "scroll 25s linear infinite",
              }}
            >
              {[...Array(10)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </Box>
          </Box>
        </>
      ) : (
        <Card
          sx={{
            maxWidth: isMobile ? '100%' : '50%',
            mx: "auto",
            p: isMobile ? 3 : 4,
            boxShadow: 6,
            borderRadius: 3,
            textAlign: "center",
            background: "#fefefe"
          }}
        >
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            🔍 LinkedIn Style Analyzer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter your LinkedIn profile link to analyze your writing style using AI.
          </Typography>
        <TextField
          label="LinkedIn Profile URL"
          placeholder="e.g. https://www.linkedin.com/in/bhaskarsriram"
          fullWidth
          variant="outlined"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          error={!!urlError} // highlights the input in red
          helperText={urlError} // shows the error message
          sx={{ mb: 2 }}
        />


          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleAnalyze}
            disabled={!linkedinUrl || loading}
            sx={{
              py: 1.5,
              fontWeight: 500,
              textTransform: 'none',
              background: '#06923E',
              "&:hover": { backgroundColor: "#057a32" }
            }}
          >
            Analyze My Style
          </Button>
        </Card>
      )}

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">Style analysis is complete!</Alert>
      </Snackbar>

      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default LinkedInStyleAnalyzer;
