import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress ,
  Box,
  useMediaQuery
} from "@mui/material";
import axios from "axios";

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SpatialAudioOffOutlinedIcon from '@mui/icons-material/SpatialAudioOffOutlined';


const GenerateWithAI = ({ open, postText, onClose, onRewriteComplete }) => {
  
    const [options, setOptions] = useState({
    lining: false,
    emojis: false,
    hook: false,
    hashtags: false,
    cta: false,
    concise: false,
    personal_style: true
  });

  const [tone, setTone] = useState("professional");
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";
  const isMobile = useMediaQuery('(max-width:600px)');
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);



  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

 const handleRewritePost = async (postText) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/rewrite-post`,
        { textPost: postText },
        { withCredentials: true }
      );

      const { generated, rewrittenText, error } = response.data;

      if (!generated) {
        // 🔴 Insufficient credits → open upgrade dialog
        if (error === "Insufficient credits") {
          setUpgradeOpen(true);
        } else {
          console.error(error || "Rewrite failed");
        }
        return;
      }

      // ✅ Post successfully generated
      if (rewrittenText) {
        onRewriteComplete(rewrittenText.post || rewrittenText);
        onClose();
      } else {
        console.error("No rewritten text received.");
      }
    } catch (err) {
      console.error("Rewrite failed:", err);
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <>
  <Dialog
  open={open}
  onClose={(event, reason) => {
    if (reason !== 'backdropClick') onClose();
  }}
  fullWidth
  disableEscapeKeyDown
  hideBackdrop={false}
  maxWidth="md"
>
      <DialogTitle sx={{ fontWeight: 500, fontSize : '22px', mt: 2 }}>✨ Rewrite with AI</DialogTitle>

      <Box sx={{ filter: isLoading ? 'blur(3px)' : 'none', pointerEvents: isLoading ? 'none' : 'auto' }}>

    
 

        <DialogContent>
        {/* <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Select enhancements you want AI to apply:
        </Typography> */}

       
<Box
  display="grid"
  gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
  gap={2}
>
  {[
    {
      key: "personal_style",
      icon: <SpatialAudioOffOutlinedIcon />,
      label: "Rewrite in my style",
     
     desc: "Transforms the article into a LinkedIn post that sounds just like you — in your tone, structure, and voice.",
      color: "#093FB4",
    }
  ].map(({ key, icon, label, desc, color }) => {
    const selected = options[key];

    return (
      <Box
        key={key}
        onClick={() => toggleOption(key)}
        sx={{
          position: "relative",
          cursor: "pointer",
          borderRadius: 3,
          border: selected ? `2px solid ${color}` : "1px solid #D0D0D0",
          backgroundColor: selected ? `${color}10` : "#F9F9F9",
          px: 2,
          py: 2,
          transition: "all 0.2s ease-in-out",
          '&:hover': {
            boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
          },
        }}
      >
        {/* ✅ Tick icon at top-right if selected */}
        {selected && (
          <CheckCircleOutlinedIcon
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              fontSize: 20,
              color: 'green',
              backgroundColor: "#fff",
              borderRadius: "50%",
            }}
          />
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box sx={{ color: color }}>{icon}</Box>
          <Typography sx={{ fontWeight: 500, fontSize: "15px" }}>
            {label}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "13px",
            color: "#555",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </Typography>
      </Box>
    );
  })}
</Box>


       
         {/* <Typography variant="subtitle1" sx={{ mb: 2, mt: 5 }}>Select Tone:</Typography> */}
        

      {/* <ToggleButtonGroup
  value={tone}
  exclusive
  onChange={(e, val) => val && setTone(val)}
  fullWidth
  sx={{
    '& .MuiToggleButton-root': {
      borderRadius: 2,
      textTransform: 'capitalize',
      fontWeight: 500,
      px: 2,
      py: 1,
      border: '1px solid #E0E0E0',
      color: '#333',
      backgroundColor: '#F8F8F8',
      '&:hover': {
        backgroundColor: '#EDEDED',
      },
      mr: 3, // Add space between buttons
    },
    '& .Mui-selected': {
      backgroundColor: '#555879 !important',
      color: '#FFFFFF',
      borderColor: '#093FB4',
    },
    '& .MuiToggleButtonGroup-grouped:last-of-type': {
      mr: 0, // Remove right margin for the last button
    }
  }}
>
  <ToggleButton value="professional">Professional</ToggleButton>
  <ToggleButton value="casual">Casual</ToggleButton>
  <ToggleButton value="motivational">Motivational</ToggleButton>
</ToggleButtonGroup> */}



      </DialogContent>
</Box>


    <DialogActions sx={{ justifyContent: "flex-end", px: 3, py: 3 }}>
  <Box sx={{ display: "flex", gap: 1 }}>
    

     <Box
      onClick={onClose}
      sx={{
        background: '#D7D7D7',
        borderRadius: '26px',
        px: 2,
        py: 0.7,
        cursor: 'pointer',
        '&:hover': {
          background: '#748873',
          color: '#FFFFFF'
        },
      }}
    >
      <Typography>Cancel</Typography>
    </Box>

    <Box
  onClick={() => !isLoading && handleRewritePost(postText, options, tone)}

  sx={{
    background: isLoading ? '#A0A0A0' : '#FE7743',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    color: '#FFFFFF',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 1.2,
    '&:hover': {
      background: isLoading ? '#A0A0A0' : '#004030',
      color: '#FFFFFF'
    }
  }}
>
  {isLoading ? (
    <Typography sx={{ fontSize: '14px' }}>Please wait...</Typography>
  ) : (
    <Typography>Rewrite</Typography>
  )}
</Box>


  </Box>
</DialogActions>

    {isLoading && (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 10,
      width: '100%',
      height: '100%',
      bgcolor: 'rgba(255, 255, 255, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4
    }}
  >
    <CircularProgress
      size={52}
      thickness={5}
      sx={{ color: '#FE7743', mb: 2 }}
    />
    <Typography sx={{ fontWeight: 500, fontSize: '16px', color: '#333' }}>
      Rewriting your post with AI...
    </Typography>
  </Box>
)}


    </Dialog>

      <Dialog
  open={upgradeOpen}
  onClose={() => setUpgradeOpen(false)}
  fullWidth
  maxWidth="xs"
>
  <DialogTitle sx={{ fontWeight: 500, fontSize: isMobile ? "18px" : "20px" }}>
    🚀 Upgrade Required
  </DialogTitle>

  <DialogContent>
    <Typography sx={{ fontSize: "15px", color: "#555", mb: 2 }}>
      You've run out of credits.<br/> 
      Upgrade your plan to continue rewriting posts with AI.
    </Typography>
  </DialogContent>

  <DialogActions sx={{ justifyContent: "flex-end", px: 3, py: 2 }}>
    <Box
      onClick={() => setUpgradeOpen(false)}
      sx={{
        background: '#D7D7D7',
        borderRadius: '26px',
        px: 2,
        py: 0.7,
        cursor: 'pointer',
        '&:hover': { background: '#748873', color: '#FFFFFF' },
      }}
    >
      <Typography>Back</Typography>
    </Box>

    <Box
      onClick={() => {
        setUpgradeOpen(false);
        window.location.href = "/pricing"; // redirect to pricing page
      }}
      sx={{
        background: '#FE7743',
        borderRadius: '26px',
        px: 3,
        py: 0.7,
        color: '#FFFFFF',
        cursor: 'pointer',
        '&:hover': { background: '#004030', color: '#FFFFFF' },
      }}
    >
      <Typography>Upgrade Plan</Typography>
    </Box>
  </DialogActions>
</Dialog>

</>
  );
};

export default GenerateWithAI;
