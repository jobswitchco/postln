import { useState, useEffect, useRef } from "react";
import {
  Box,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Stack,
  Radio,
  FormControl,
  MenuItem,
  Select,
  Snackbar,
  ClickAwayListener,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Divider,
  Button,
  Grid
} from "@mui/material";
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ImageIcon from "@mui/icons-material/Image";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import RewriteAiDialog from "./RewriteAiDialog";
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import axios from "axios";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FullScreenLoader from './FullScreenLoader';



dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);



const PostComposer = () => {
  const [open, setOpen] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerText, setComposerText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingTranscribe, setLoadingTranscribe] = useState(false);
  const [postText, setPostText] = useState("");
  const [postVisibility, setPostVisibility] = useState("anyone");
const [settingsOpen, setSettingsOpen] = useState(false);
const [scheduleOpen, setScheduleOpen] = useState(false);
const [scheduleOpenAi, setScheduleOpenAi] = useState(false);
const [selectedDate, setSelectedDate] = useState(dayjs());
const [selectedTime, setSelectedTime] = useState("");
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);
const [isRewriteOpen, setIsRewriteOpen] = useState(false);
const [originalPostText, setOriginalPostText] = useState("");
const inputRef = useRef(null);
const [cursorPos, setCursorPos] = useState(0);
 const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [isListening, setIsListening] = useState(false);
const recognitionRef = useRef(null);
const isManuallyStopped = useRef(false);
  const [editedText, setEditedText] = useState("");
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTrainDialogOpen, setIsTrainDialogOpen] = useState(false);
  


const [publishSuccessSnackbar, setPublishSuccessSnackbar] = useState({
  open: false,
  message: "",
});
 const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl = "/api/usersOn";


    const [rewrites, setRewrites] = useState([]); // string[] or {post, rating}[]
    const [currentIdx, setCurrentIdx] = useState(0);

    const [versionsOpen, setVersionsOpen] = useState(false);

const normalizeRewrites = (res) => {
  if (Array.isArray(res)) {
    return res
      .map(r => (typeof r === "string" ? r : r?.post || ""))
      .filter(Boolean);
  }
  return [typeof res === "string" ? res : res?.post || ""].filter(Boolean);
};


const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    setSelectedImage(URL.createObjectURL(file));
  }
};

const wordCount = postText.trim().split(/\s+/).filter(Boolean).length;

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(postText);
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const initSpeechRecognition = async () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Your browser does not support speech recognition.");
    return;
  }

  // ✅ Check if mic permission is granted
  const checkMicPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      if (result.state === 'denied') {
        alert("Microphone access is blocked. Please allow it in your browser settings (click the lock icon near the address bar).");
        return false;
      }
      return true;
    } catch (err) {
      // Permissions API not supported (safe fallback)
      return true;
    }
  };

  // ⚠️ Don't start if mic is blocked
  const hasPermission = await checkMicPermission();
  if (!hasPermission) return;

  if (!recognitionRef.current) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setLoadingTranscribe(false);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setLoadingTranscribe(true);
      try {
        const res = await axios.post(`${baseUrl}/transcribe-whisper`, {
          voiceText: transcript
        });
        setPostText(prev => `${prev}\n${res.data.transcribedText}`);
      } catch (error) {
        console.error("Transcription failed:", error);
      } finally {
        setTimeout(() => {
          setLoadingTranscribe(false);
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);

      if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please enable it in browser settings and reload the page.");
      }

      setIsListening(false);
      setLoadingTranscribe(false);
    };

    recognition.onend = () => {
      if (!isManuallyStopped.current) {
        recognition.start(); // restart listening
      } else {
        setIsListening(false);
        isManuallyStopped.current = false; // reset
      }
    };

    recognitionRef.current = recognition;
  }

  if (isListening) {
    // Stop listening
    isManuallyStopped.current = true;
    recognitionRef.current.stop();
  } else {
    // Start listening
    isManuallyStopped.current = false;
    recognitionRef.current.start();
  }
};





const handlePublish = async (textContent) => {
  try {
    setPublishing(true);

    let res;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("postText", textContent);

      const blob = await fetch(selectedImage).then(r => r.blob());
      const file = new File([blob], "upload.jpg", { type: blob.type });
      formData.append("image", file);

      res = await axios.post(baseUrl + "/publish-media-post", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      res = await axios.post(baseUrl + "/publish-text-post", { postText: textContent}, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    setOpen(false);
    setPublishing(false);
    setVersionsOpen(false);
    setComposerOpen(false);
    setConfirmOpen(false);
    setSettingsOpen(false);
    setScheduleOpen(false);
    setIsRewriteOpen(false);

    setPublishSuccessSnackbar({
  open: true,
  message: "Post is published",
});
    setPostText("");
    setOriginalPostText("");
    setSelectedImage(null);
  } catch (err) {
    setPublishing(false);
    console.error("Failed to publish:", err.response?.data || err.message);
  }
};

const handleSchedule = async (textContent) => {
  try {
    setScheduling(true);

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const scheduledAt = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${selectedTime}`, "YYYY-MM-DD h:mm A")
      .tz(userTimezone)
      .toISOString();

    let res;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("postText", textContent);
      formData.append("schedule_at", scheduledAt);
      formData.append("postType", "media");

      const blob = await fetch(selectedImage).then((r) => r.blob());
      const file = new File([blob], "upload.jpg", { type: blob.type });
      formData.append("image", file);

      res = await axios.post(`${baseUrl}/schedule-media-post`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      res = await axios.post(
        `${baseUrl}/schedule-text-post`,
        {
          postText : textContent,
          scheduledAt,
          postType: "text",
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (res?.data?.scheduled) {
     setPublishSuccessSnackbar({
  open: true,
  message: "Post is scheduled",
});
      setOpen(false);
      setScheduleOpen(false);
      setScheduleOpenAi(false);
        setVersionsOpen(false);
    setComposerOpen(false);
    setConfirmOpen(false);
    setSettingsOpen(false);
    setIsRewriteOpen(false);
      setPostText("");
    setOriginalPostText("");
      setSelectedImage(null);
    }

    setScheduling(false);
  } catch (err) {
    setScheduling(false);
    console.error("Failed to schedule:", err.response?.data || err.message);
  }
};

const handleSaveDraft = async () => {
  try {
    setDrafting(true);

    let res;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("postText", editedText);
      formData.append("postType", "media");

      const blob = await fetch(selectedImage).then((r) => r.blob());
      const file = new File([blob], "draft-upload.jpg", { type: blob.type });
      formData.append("image", file);

      res = await axios.post(`${baseUrl}/save-draft-media-post`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      res = await axios.post(
        `${baseUrl}/save-draft-text-post`,
        {
          postText: editedText,
          postType: "text",
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (res?.data?.draftSaved) {
     setPublishSuccessSnackbar({
  open: true,
  message: "Draft is saved",
});
      setOpen(false);
      setConfirmOpen(false);
      setPostText("");
    setOriginalPostText("");
      setSelectedImage(null);
       setVersionsOpen(false);
    setComposerOpen(false);
    setConfirmOpen(false);
    setSettingsOpen(false);
    setScheduleOpen(false);
    setIsRewriteOpen(false);
    }

    setDrafting(false);
  } catch (err) {
    setDrafting(false);
    console.error("Failed to save draft:", err.response?.data || err.message);
  }
};


const handleContinueToTraining = () => {
  setIsTrainDialogOpen(false);
  window.open("/analyze/my_style", "_blank");
};

const CHARACTER_LIMIT = 2800;
const isCharLimitExceeded =
  postText.length > CHARACTER_LIMIT || originalPostText.length > CHARACTER_LIMIT;






const CustomTooltip = styled(({ className, placement = "left", ...props }) => (
  <Tooltip {...props} placement={placement} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#F6F6F6',
    color: '#000000',
    fontSize: 13,
    borderRadius: 26,
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
}));



  const handleMainDialogOpen = () => setOpen(true);

  // put near other handlers
const handleMainClose = () => {
    setPostText("");
  setOpen(false);
};


const getAvailableTimeSlots = (selectedDate) => {
  const now = dayjs();
  const selected = dayjs(selectedDate).startOf('day');
  let startTime;

  // If selected date is today
  if (selected.isSame(now, 'day')) {
    // Round to next 15-minute block from now + 30 minutes
    startTime = now.add(30, 'minute');
    const remainder = 15 - (startTime.minute() % 15);
    startTime = startTime.add(remainder, 'minute');
  } else {
    // For future dates, start from 12:00 AM
    startTime = selected.startOf('day');
  }

  const endTime = selected.endOf('day');
  const slots = [];

  while (startTime.isSameOrBefore(endTime)) {
    slots.push(startTime.format('h:mm A'));
    startTime = startTime.add(15, 'minute');
  }

  return slots;
};


useEffect(() => {
  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get-user-name-image`, {
        withCredentials: true,
      });

      setUserName(response.data.name);
      setProfilePicture(response.data.profilePicture);
      setIsModelReady(response.data.modelReady || false);
    } catch (error) {
      console.error("Failed to fetch user name or model status:", error);
      setUserName("");
      setIsModelReady(false);
    }
  };

  fetchUserDetails();
}, []);





  const handleDiscard = () => {
    // setPostText("");
    setOriginalPostText("");
    setConfirmOpen(false);
    setComposerOpen(false);
    setVersionsOpen(true);
    // setOpen(false);
  };

    // Helpers for carousel (mobile)
    const prevCard = () => setCurrentIdx((p) => (p - 1 + rewrites.length) % rewrites.length);
    const nextCard = () => setCurrentIdx((p) => (p + 1) % rewrites.length);
  
    // NEW: open composer helper
  const openComposer = (text) => {
  const t = text ?? "";
  setComposerText(t);
  setComposerOpen(true);
    setEditedText(t);
  setVersionsOpen(false);
  setShowEmojiPicker(false);
};

  
    const VersionCard = ({ index, item }) => {
      const text = typeof item === "string" ? item : item?.post || "";
      return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography sx={{ fontFamily: 'Inter', fontSize : '12px', fontWeight : 600, color: 'grey'}}>Version {index + 1}</Typography>
             
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
          </CardContent>
          <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
            {/* UPDATED: opens the dedicated composer */}
  
            <Button
    size="small"
    onClick={() => openComposer(text)}
    variant="contained"
    sx={{
      backgroundColor: '#093FB4',   // custom background
      borderRadius: '20px',         // rounded corners
      textTransform: 'none',        // prevent ALL CAPS
      fontSize: '14px',             // custom font size
      fontWeight: 500,
      px: 2,                        // horizontal padding
      py: 0.5,                      // vertical padding
      boxShadow: '0px 3px 6px rgba(0,0,0,0.15)', // subtle shadow
      '&:hover': {
        backgroundColor: '#004030', // custom hover color
      },
    }}
  >
    Use this
  </Button>
  
          </CardActions>
        </Card>
      );
    };

  return (
    <>
      {/* Initial Box */}

<Box
  onClick={handleMainDialogOpen}
  sx={{
    borderRadius: 3,
    p: 3,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    cursor: "pointer",
    margin: "auto",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)",
    background: "#E4EFE7",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "scale(1.02)",
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    },
  }}
>
  <Stack
    sx={{
      display: "flex",
      flexDirection: "row",
      gap: 1,
      alignItems: "center",
    }}
  >
    <LinkedInIcon sx={{fontSize : '36px'}}/>

    <Typography sx={{ fontSize: "16px", fontWeight: 500 }}>
      Create a new post
    </Typography>
  </Stack>

  <Box>
    <Typography sx={{ fontSize: "14px", color: "#3E3F5B" }}>
      Turn your drafts/ideas into powerful LinkedIn posts with PostLn.
Write in your own voice—guided by viral formats and real-time industry trends.
    </Typography>
  </Box>
</Box>



      {/* Main Dialog */}
      {publishing ? (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box sx={{ width: '60%', mb: 2 }}>
      <Box sx={{ height: 8, backgroundColor: '#ccc', borderRadius: 10 }}>
        <Box
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: '#093FB4',
            borderRadius: 10,
            animation: 'loading 2s infinite',
          }}
        />
      </Box>
    </Box>
    <Typography sx={{ fontWeight: 500 }}>Publishing...</Typography>
  </Box>
) : (
    <Dialog
  open={open}
  onClose={handleMainClose}
  fullWidth
  fullScreen={isMobile}
  disableEscapeKeyDown
  hideBackdrop={false}
  PaperProps={{
    sx: {
      width: isMobile ? "100%" : "50%",
      borderRadius: isMobile ? 0 : 3,
    },
  }}
>


        <DialogContent sx={{ position: "relative", pt: 4 }}>
          {/* Close Icon */}
        <IconButton
                onClick={handleMainClose}
                sx={{ position: "absolute", top: 8, right: 8 }}
                >
                <CloseIcon />
                </IconButton>


          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar src={profilePicture} />
            <Stack sx={{ display : 'flex', flexDirection : 'column'}}>

         <Stack sx={{ display: 'flex', flexDirection: 'column' }}>
  <Typography sx={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 500 }}>{userName}</Typography>

  <Stack
    sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', cursor: 'pointer' }}
    onClick={() => setSettingsOpen(true)}
  >
    <Typography sx={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 400, color: 'grey' }}>
      Post to {postVisibility === "anyone" ? "Anyone" : "Connections only"}
    </Typography>
    <ArrowDropDownOutlinedIcon />
  </Stack>
</Stack>


            </Stack>

          </Box>
<Box
  sx={{
    maxHeight: isMobile ? 450 : 400,
    overflowY: 'auto',
    mt: 1,
    // scrollbar customization below
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#F0F0F0',
      borderRadius: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#BDBDBD',
      borderRadius: '8px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: '#9E9E9E',
    },
  }}
>

  {/* Text Area */}

  <TextField
    multiline
    minRows={6}
    value={postText}
    onChange={(e) => setPostText(e.target.value)}
    onClick={(e) => {
      const position = e.target.selectionStart;
      setCursorPos(position);
    }}
    onKeyUp={(e) => {
      const position = e.target.selectionStart;
      setCursorPos(position);
    }}
    inputRef={inputRef}
    placeholder="Share your thoughts..."
    fullWidth
    variant="standard"
    InputProps={{
      disableUnderline: true,
      sx: { p: 0, fontSize: isMobile ? 15 : 16 },
    }}
    sx={{
      backgroundColor: "transparent",
      border: "none",
      p: 0
    }}
  />

  {/* Image Preview */}
  {selectedImage && (
    <Box sx={{ position: 'relative', mt: 2 }}>
      <IconButton
        onClick={() => setSelectedImage(null)}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 1,
          background: '#fff'
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <img
        src={selectedImage}
        alt="preview"
        style={{
          width: '100%',
          borderRadius: 8,
          objectFit: 'cover',
          maxHeight: 250
        }}
      />
    </Box>
  )}
</Box>

      


          {/* Action Buttons */}
           <Box
    sx={{
      position: "sticky",
      bottom: 0,
      width: "100%",
      backgroundColor: "#fff",
      borderTop: "1px solid #e0e0e0",
      px: isMobile ? 0 : 3,
      zIndex: 5,
      py: isMobile ? 0.5 : 1
    }}
  >

        {/* Bottom Icons + Character Counter */}
         <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
  {/* Left: Icons */}
  <Stack direction="row" alignItems="center" spacing={1}>
    <IconButton onClick={handleCopy}>
      <ContentCopyIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
    </IconButton>
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={2000}
      onClose={() => setSnackbarOpen(false)}
      message="Copied!"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />

    <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
      <InsertEmoticonIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
    </IconButton>

    {showEmojiPicker && (
      <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
        <Box sx={{ position: 'absolute', zIndex: 10, top: 160, right: isMobile ? 0 : 20, maxWidth: '100%' }}>
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              if (inputRef.current) {
                const currentText = postText;
                const emojiChar = emoji.native;
                const before = currentText.slice(0, cursorPos);
                const after = currentText.slice(cursorPos);
                const newText = before + emojiChar + after;

                setPostText(newText);

                requestAnimationFrame(() => {
                  inputRef.current.focus();
                  const newPos = cursorPos + emojiChar.length;
                  inputRef.current.setSelectionRange(newPos, newPos);
                  setCursorPos(newPos);
                });

                setShowEmojiPicker(false);
              }
            }}
          />
        </Box>
      </ClickAwayListener>
    )}

    <IconButton component="label">
      <ImageIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
      <input
        type="file"
        hidden
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleImageSelect}
      />
    </IconButton>


{loadingTranscribe ? (
  <Box className="waveform" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <div></div><div></div><div></div><div></div><div></div>
    <Typography sx={{ fontSize: isMobile ? '12px' : '14px', color: 'gray' }}>Transcribing...</Typography>
  </Box>
) : (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <IconButton onClick={initSpeechRecognition}>
      <KeyboardVoiceIcon
        sx={{
          fontSize: isMobile ? '20px' : '22px',
          color: isListening ? 'red' : 'inherit'
        }}
      />
    </IconButton>
    {isListening && (
      <Typography sx={{ fontSize: isMobile ? '12px' : '14px', color: 'gray' }}>
        Listening...
      </Typography>
    )}
  </Box>
)}




  </Stack>

  {/* Right: Character Count */}
  {postText.length !== 0 && (
    <Typography
      sx={{fontSize : isMobile ? '12px' : '14px', fontWeight: 400 }}
      variant="body2"
      color={postText.length > CHARACTER_LIMIT ? 'error' : 'text.secondary'}
    >
      {postText.length} / {CHARACTER_LIMIT} characters
    </Typography>
  )}
</Box>
          <Stack
            direction="row"
            spacing={2}
            justifyContent= { isMobile ? "space-between" : "flex-end" }
            mt={1}
          >

            <Stack sx={{ display : 'flex', flexDirection : isMobile ? 'column' : 'row', gap: 1}}>

{originalPostText && postText !== originalPostText && (
  <IconButton
    onClick={() => {
      setPostText(originalPostText);        // revert to original
      setOriginalPostText("");              // clear backup
    }}
    sx={{
      border: '1px solid #E0E0E0',
      borderRadius: '8px',
      px: isMobile ? 1 : 1,
      py: 0.5,
      mr: 1
    }}
  >
    <ReplayOutlinedIcon fontSize="small" />
    <Typography sx={{ ml: 1, fontSize : isMobile ? '14px' : '16px' }}>Undo</Typography>
  </IconButton>
)}


{!originalPostText && postText !== originalPostText && (


<CustomTooltip placement="top" title={wordCount <= 20 ? "Not enough content" : ""} disableHoverListener={wordCount > 20}>
  <Box
    sx={{
      color: wordCount > 20 ? '#000000' : '#FFFFFF',
      background: wordCount > 20 ? 'transparent' : '#C4C4C4',
      border: wordCount > 20 ? '1px solid grey' : '',
      borderRadius: '26px',
      px: 1.2,
      py: 0.7,
      display: 'flex',
      flexDirection: 'row',
      gap: 1,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: wordCount > 20 ? 'pointer' : 'not-allowed',
      // Remove pointerEvents to let tooltip trigger on hover
      '&:hover': {
        border: wordCount > 20 ? '1px solid #093FB4' : ''
      },
    }}
onClick={() => {
  if (wordCount > 20) {
    // 🛑 Stop mic if listening
    if (isListening && recognitionRef.current) {
      isManuallyStopped.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
 if (isModelReady) {
    setIsRewriteOpen(true);
  } else {
    setIsTrainDialogOpen(true);
  }
  }
}}


  >
    <AutoAwesomeOutlinedIcon sx={{ fontSize : isMobile ? '16px' : '22px'}}/>
    <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Rewrite with AI</Typography>
  </Box>
</CustomTooltip>
)}

</Stack>

<Stack sx={{ display : 'flex', flexDirection : 'row', gap: 1}}>
           
  <CustomTooltip
  placement="left"
  title={isCharLimitExceeded ? "Exceeded characters" : "Schedule for later"}
>
  <Box
    onClick={() => {
      if (!isCharLimitExceeded && postText.trim() !== '') setScheduleOpen(true);
    }}
    sx={{
      background: postText.trim() === '' || isCharLimitExceeded ? '#C4C4C4' : '#093FB4',
      borderRadius: '4px',
      px: 1,
      py: 0.7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      cursor: postText.trim() === '' || isCharLimitExceeded ? 'not-allowed' : 'pointer',
      pointerEvents: postText.trim() === '' || isCharLimitExceeded ? 'none' : 'auto',
      '&:hover': {
        background: postText.trim() === '' || isCharLimitExceeded ? '#C4C4C4' : '#004030',
      },
    }}
  >
    <CalendarMonthIcon />
  </Box>
</CustomTooltip>




<CustomTooltip
  placement="left"
  title={isCharLimitExceeded ? "Exceeded characters" : ""}
>
  <Box
    onClick={() => {
      if (!isCharLimitExceeded && postText.trim() !== '') handlePublish(postText);
    }}
    sx={{
      background: postText.trim() === '' || isCharLimitExceeded ? '#C4C4C4' : '#093FB4',
      borderRadius: '26px',
      px: 3,
      py: 0.7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      cursor: postText.trim() === '' || isCharLimitExceeded ? 'not-allowed' : 'pointer',
      pointerEvents: postText.trim() === '' || isCharLimitExceeded ? 'none' : 'auto',
      '&:hover': {
        background: postText.trim() === '' || isCharLimitExceeded ? '#C4C4C4' : '#004030',
      },
    }}
  >
    <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Publish</Typography>
  </Box>
</CustomTooltip>

</Stack>

          </Stack>
          </Box>

        </DialogContent>
      </Dialog>
)}

      {/* Confirmation Dialog */}
        {drafting ? (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box sx={{ width: '60%', mb: 2 }}>
      <Box sx={{ height: 8, backgroundColor: '#ccc', borderRadius: 10 }}>
        <Box
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: '#093FB4',
            borderRadius: 10,
            animation: 'loading 2s infinite',
          }}
        />
      </Box>
    </Box>
    <Typography sx={{ fontWeight: 500 }}>Saving Draft...</Typography>
  </Box>
): 
( 
  <Dialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)} // <-- Proper close handler
  fullWidth
  maxWidth="sm"
>
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize : isMobile ? '16px' : '16px', fontWeight : 500 }}>
    Save this post as a draft?
    <IconButton
      aria-label="close"
      onClick={() => setConfirmOpen(false)}
      sx={{ color: (theme) => theme.palette.grey[500] }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent>
    <Typography sx={{ fontSize : isMobile ? '15px' : '16px'}}>
      The post you started will be here when you return.
    </Typography>
  </DialogContent>

  <DialogActions sx={{ py: 3, px: 3 }}>
    <Box
      onClick={handleDiscard}
      sx={{
        background: '#D7D7D7',
        borderRadius: '26px',
        px: 3,
        py: 0.7,
        cursor: 'pointer',
        '&:hover': {
          background: '#748873',
          color: '#FFFFFF',
        },
      }}
    >
      <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Discard</Typography>
    </Box>

    <Box
      onClick={handleSaveDraft}
      sx={{
        background: postText?.trim?.() === '' ? '#C4C4C4' : '#093FB4',
        borderRadius: '26px',
        px: 3,
        py: 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        cursor: postText?.trim?.() === '' ? 'not-allowed' : 'pointer',
        pointerEvents: postText?.trim?.() === '' ? 'none' : 'auto',
        '&:hover': {
          background: postText?.trim?.() === '' ? '#C4C4C4' : '#004030',
        },
      }}
    >
      <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Save as draft</Typography>
    </Box>
  </DialogActions>
</Dialog>

  )}



      <Dialog
  open={settingsOpen}
  onClose={() => {}}
  disableEscapeKeyDown
  hideBackdrop={false}
   fullWidth
  maxWidth="xs"
  
>
  <DialogTitle>
    
    <Stack sx={{ display : 'flex', flexDirection : 'column'}}>
        <Typography sx={{ fontSize : '18px', fontWeight : 500}}>Post settings</Typography>
        <Typography sx={{ fontSize : '14px', fontWeight : 400}}>Who can see your post?</Typography>
    </Stack>
    
    </DialogTitle>
  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
    <Box
          onClick={() => setPostVisibility("anyone")}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderRadius: 2,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
            sx={{
                background : '#EAEFEF',
                p: 1,
                borderRadius : '100%'
            }}>

            <PublicOutlinedIcon sx={{ fontSize : '26px', color: '#000000'}}/>
            </Box>
            <Box>
              <Typography fontWeight={500} fontSize={16}>
                Anyone
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                Anyone on or off LinkedIn
              </Typography>
            </Box>
          </Stack>

          <Radio
            checked={postVisibility === "anyone"}
            sx={{
              color: "#1976d2",
              "&.Mui-checked": {
                color: "#093FB4",
              },
              transform: "scale(1.2)",
            }}
            disableRipple
          />
        </Box>

        <Box
          onClick={() => setPostVisibility("connections")}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderRadius: 2,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
            sx={{
                background : '#EAEFEF',
                p: 1,
                borderRadius : '100%'
            }}>

            <GroupAddOutlinedIcon sx={{ fontSize : '26px', color: '#000000'}}/>
            </Box>
         
            <Box>
              <Typography fontWeight={500} fontSize={16}>
                Connections only
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                Only your LinkedIn connections
              </Typography>
            </Box>
          </Stack>

          <Radio
            checked={postVisibility === "connections"}
            sx={{
              color: "#1976d2",
              "&.Mui-checked": {
                color: "#093FB4",
              },
              transform: "scale(1.2)",
            }}
            disableRipple
          />
        </Box>
    </Stack>
  </DialogContent>
  <DialogActions sx={{ py: 3, px: 2}}>
   <Box
  onClick={() => setSettingsOpen(false)}
  sx={{
    background: '#D7D7D7',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    cursor: 'pointer',
    '&:hover': {
      background: '#748873',
      color: '#FFFFFF'
    },
  }}
>
  <Typography>Back</Typography>
</Box>

      <Box
  onClick={() => setSettingsOpen(false)}
  sx={{
    background: '#093FB4',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    color: '#FFFFFF',
    cursor: 'pointer',
    '&:hover': {
        background: '#004030',
      color: '#FFFFFF'
    },
  }}
>
  <Typography>Done</Typography>
</Box>
  </DialogActions>
</Dialog>


  {scheduling ? (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box sx={{ width: '60%', mb: 2 }}>
      <Box sx={{ height: 8, backgroundColor: '#ccc', borderRadius: 10 }}>
        <Box
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: '#093FB4',
            borderRadius: 10,
            animation: 'loading 2s infinite',
          }}
        />
      </Box>
    </Box>
    <Typography sx={{ fontWeight: 500 }}>Scheduling post...</Typography>
  </Box>
) : (
<Dialog
  open={scheduleOpen}
  onClose={() => {}}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: { borderRadius: 3 }
  }}
>
  <DialogTitle>Schedule post</DialogTitle>
  <DialogContent>
    <Typography variant="subtitle2" sx={{ mb: 4}}>
      {/* {dayjs().tz("Asia/Kolkata").format("ddd, MMM D, h:mm A")} India Standard Time, based on your location */}
    </Typography>

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Date"
        value={selectedDate}
        onChange={(newDate) => setSelectedDate(newDate)}
        disablePast
        minDate={dayjs()}
      />
    </LocalizationProvider>

  <FormControl
  fullWidth={false}
  sx={{ mt: 3, width: isMobile ? '90%' : '400px' }}
>
  <Select
    value={selectedTime}
    displayEmpty
    onChange={(e) => setSelectedTime(e.target.value)}
    renderValue={(selected) =>
      selected ? selected : <Typography color="text.secondary">Time</Typography>
    }
  >
    {getAvailableTimeSlots(selectedDate).map((slot) => (
      <MenuItem key={slot} value={slot}>
        {slot}
      </MenuItem>
    ))}
  </Select>
</FormControl>

   
  </DialogContent>
  <DialogActions sx={{ px: 3, py: 3}}>
   <Box
  onClick={() => setScheduleOpen(false)}
  sx={{
    background: '#D7D7D7',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    cursor: 'pointer',
    '&:hover': {
      background: '#748873',
      color: '#FFFFFF'
    },
  }}
>
  <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Back</Typography>
</Box>
  
  
  <Box
  onClick={()=> handleSchedule(postText)}
  sx={{
    background: postText.trim() === '' ? '#C4C4C4' : '#093FB4',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    display: 'flex',          
    alignItems: 'center',     
    justifyContent: 'center',     
    color: '#FFFFFF',
    cursor: postText.trim() === '' ? 'not-allowed' : 'pointer',
    pointerEvents: postText.trim() === '' ? 'none' : 'auto',
    '&:hover': {
      background: postText.trim() === '' ? '#C4C4C4' : '#004030',
    },
  }}
>
  <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Schedule</Typography>
</Box>
  </DialogActions>
</Dialog> )}

  {scheduling ? (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box sx={{ width: '60%', mb: 2 }}>
      <Box sx={{ height: 8, backgroundColor: '#ccc', borderRadius: 10 }}>
        <Box
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: '#093FB4',
            borderRadius: 10,
            animation: 'loading 2s infinite',
          }}
        />
      </Box>
    </Box>
    <Typography sx={{ fontWeight: 500 }}>Scheduling post...</Typography>
  </Box>
) : (
<Dialog
  open={scheduleOpenAi}
  onClose={() => {}}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: { borderRadius: 3 }
  }}
>
  <DialogTitle>Schedule post</DialogTitle>
  <DialogContent>
    <Typography variant="subtitle2" sx={{ mb: 4}}>
      {/* {dayjs().tz("Asia/Kolkata").format("ddd, MMM D, h:mm A")} India Standard Time, based on your location */}
    </Typography>

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Date"
        value={selectedDate}
        onChange={(newDate) => setSelectedDate(newDate)}
        disablePast
        minDate={dayjs()}
      />
    </LocalizationProvider>

  <FormControl
  fullWidth={false}
  sx={{ mt: 3, width: isMobile ? '90%' : '400px' }}
>
  <Select
    value={selectedTime}
    displayEmpty
    onChange={(e) => setSelectedTime(e.target.value)}
    renderValue={(selected) =>
      selected ? selected : <Typography color="text.secondary">Time</Typography>
    }
  >
    {getAvailableTimeSlots(selectedDate).map((slot) => (
      <MenuItem key={slot} value={slot}>
        {slot}
      </MenuItem>
    ))}
  </Select>
</FormControl>

   
  </DialogContent>
  <DialogActions sx={{ px: 3, py: 3}}>
   <Box
  onClick={() => setScheduleOpenAi(false)}
  sx={{
    background: '#D7D7D7',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    cursor: 'pointer',
    '&:hover': {
      background: '#748873',
      color: '#FFFFFF'
    },
  }}
>
  <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Back</Typography>
</Box>
  
  
  <Box
  onClick={()=> handleSchedule(editedText)}
  sx={{
    background: editedText.trim() === '' ? '#C4C4C4' : '#093FB4',
    borderRadius: '26px',
    px: 3,
    py: 0.7,
    display: 'flex',          
    alignItems: 'center',     
    justifyContent: 'center',     
    color: '#FFFFFF',
    cursor: editedText.trim() === '' ? 'not-allowed' : 'pointer',
    pointerEvents: editedText.trim() === '' ? 'none' : 'auto',
    '&:hover': {
      background: editedText.trim() === '' ? '#C4C4C4' : '#004030',
    },
  }}
>
  <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Schedule</Typography>
</Box>
  </DialogActions>
</Dialog> )}

<RewriteAiDialog
  open={isRewriteOpen}
  postText={postText}
  onClose={() => setIsRewriteOpen(false)}
  onReplace={(result) => {
    setIsRewriteOpen(false);
    const arr = normalizeRewrites(result);
    setRewrites(arr);
    setVersionsOpen(true);       // <-- open full-screen versions chooser
  }}
/>



  {publishing ? (
        <FullScreenLoader open={publishing} message="Publishing..." />
      ) : (
      <Dialog
        open={composerOpen}
        onClose={() => {}}
        fullWidth
  fullScreen={isMobile}
        disableEscapeKeyDown
        hideBackdrop={false}
       PaperProps={{
    sx: {
      width: isMobile ? "100%" : "50%",
      borderRadius: isMobile ? 0 : 3,
    },
  }}
      >
        <DialogContent sx={{ position: "relative", pt: 4 }}>
          {/* Close Icon */}
          <IconButton
            onClick={() => {
              if ((composerText?.trim?.() ?? "") === "") {
                setComposerOpen(false);
              } else {
                setConfirmOpen(true);
              }
            }}
            sx={{ position: "absolute", top: 8, right: 8 }}
            aria-label="Close composer"
          >
            <CloseIcon />
          </IconButton>

          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar src={profilePicture} />
            <Stack>
              <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>{userName}</Typography>
              <Stack
                sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setSettingsOpen(true)}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 400, color: 'grey' }}>
                  Post to {postVisibility === "anyone" ? "Anyone" : "Connections only"}
                </Typography>
                <ArrowDropDownOutlinedIcon />
              </Stack>
            </Stack>
          </Box>

          {/* MAIN CONTENT: multiline editor */}
          <TextField
            inputRef={inputRef}
            multiline
            minRows={8}
            fullWidth
            placeholder="Write your post..."
            value={composerText}
            onChange={(e) => {
              const val = e.target.value;
              setComposerText(val);
              setEditedText(val);
            }}
            onSelect={(e) => {
              const target = e.target;
              setCursorPos(target.selectionStart || 0);
            }}
          />

          {/* IMAGE PREVIEW */}
{selectedImage && (
  <Box sx={{ mt: 2 }}>
    <Box
      sx={{
        position: 'relative',
        border: '1px solid #eee',
        borderRadius: 2,
        p: 1,
        bgcolor: '#fafafa',
      }}
    >
      <img
        src={selectedImage}
        alt="Selected"
        style={{
          width: '100%',
          maxHeight: isMobile ? 260 : 420,
          objectFit: 'contain',
          borderRadius: 8,
          display: 'block',
        }}
      />
      <IconButton
        size="small"
        onClick={() => setSelectedImage(null)}
        sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'white' }}
        aria-label="Remove image"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  </Box>
)}


          {/* Bottom Icons + Character Counter */}
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              width: "100%",
              backgroundColor: "#fff",
              borderTop: "1px solid #e0e0e0",
              px: isMobile ? 0 : 3,
              py: isMobile ? 0.5 : 1,
              zIndex: 5,
              mt: 2
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => handleCopy(composerText)}>
                <ContentCopyIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
              </IconButton>
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={() => setSnackbarOpen(false)}
                message="Copied!"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              />

              <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
                <InsertEmoticonIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
              </IconButton>

              {showEmojiPicker && (
                <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
                  <Box sx={{ position: 'absolute', zIndex: 10, top: 160, right: 20 }}>
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji) => {
                        const currentText = composerText || "";
                        const emojiChar = emoji.native;
                        const before = currentText.slice(0, cursorPos);
                        const after = currentText.slice(cursorPos);
                        const newText = before + emojiChar + after;
                        setComposerText(newText);
              setEditedText(newText);
                        requestAnimationFrame(() => {
                          if (inputRef.current) {
                            inputRef.current.focus();
                            const newPos = (cursorPos || 0) + emojiChar.length;
                            inputRef.current.setSelectionRange(newPos, newPos);
                            setCursorPos(newPos);
                          }
                        });
                        setShowEmojiPicker(false);
                      }}
                    />
                  </Box>
                </ClickAwayListener>
              )}

              <IconButton component="label">
                <ImageIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
                <input
  type="file"
  hidden
  accept="image/png, image/jpeg, image/jpg"
  onChange={(e) => {
    handleImageSelect(e);
    e.target.value = null; // allow re-selecting same file
  }}
/>
              </IconButton>

              {(composerText?.length || 0) > 0 && (
                <Typography
                  sx={{ ml: "auto", fontSize: isMobile ? '12px' : '14px', fontWeight: 400 }}
                  variant="body2"
                  color={(composerText?.length || 0) > CHARACTER_LIMIT ? 'error' : 'text.secondary'}
                >
                  {(composerText?.length || 0)} / {CHARACTER_LIMIT} characters
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
              <CustomTooltip placement="left" title={(composerText?.length || 0) > CHARACTER_LIMIT ? "Exceeded characters" : "Schedule for later"}>
                <Box
                  onClick={() => {
                    if ((composerText?.trim?.() || "") && (composerText.length <= CHARACTER_LIMIT)) {
                      setScheduleOpenAi(true);
                    }
                  }}
                  sx={{
                    background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#093FB4',
                    borderRadius: '4px',
                    px: 1,
                    py: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'not-allowed' : 'pointer',
                    pointerEvents: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'none' : 'auto',
                    '&:hover': { background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#004030' },
                  }}
                >
                  <CalendarMonthIcon />
                </Box>
              </CustomTooltip>

              <CustomTooltip placement="left" title={(composerText?.length || 0) > CHARACTER_LIMIT ? "Exceeded characters" : ""}>
                <Box
                  onClick={() => {
                    if ((composerText?.trim?.() || "") && (composerText.length <= CHARACTER_LIMIT)) {
                      handlePublish(editedText); // uses editedText (kept in sync)
                    }
                  }}
                  sx={{
                    background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#093FB4',
                    borderRadius: '26px',
                    px: 3,
                    py: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'not-allowed' : 'pointer',
                    pointerEvents: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'none' : 'auto',
                    '&:hover': { background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#004030' },
                  }}
                >
                  <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Publish</Typography>
                </Box>
              </CustomTooltip>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
      )}

      <Dialog
  open={versionsOpen}
  onClose={() => setVersionsOpen(false)}
  fullScreen   // full screen on desktop too
>
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
               <Avatar src={profilePicture} />
               <Stack>
                 <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>{userName}</Typography>
                 <Stack
                   sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', cursor: 'pointer' }}
                   onClick={() => setSettingsOpen(true)}
                 >
                   <Typography sx={{ fontSize: '14px', fontWeight: 400, color: 'grey' }}>
                     Post to {postVisibility === "anyone" ? "Anyone" : "Connections only"}
                   </Typography>
                   <ArrowDropDownOutlinedIcon />
                 </Stack>
               </Stack>
             </Box>
    <IconButton onClick={() => setVersionsOpen(false)}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent sx={{ pt: 2 }}>
    <Grid container spacing={2}>
      {rewrites.map((item, idx) => (
        <Grid key={idx} item xs={12} md={4}>
          <VersionCard index={idx} item={item} />
        </Grid>
      ))}
    </Grid>
  </DialogContent>
</Dialog>


<Dialog
  open={isTrainDialogOpen}
  onClose={() => setIsTrainDialogOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
 Pending: Posts Analysis
  </DialogTitle>
  <DialogContent dividers>
    <Typography>
      To unlock rewriting in your own style, please continue with analyzing your past linkedin posts.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setIsTrainDialogOpen(false)}>Cancel</Button>
      <Box
                 onClick={handleContinueToTraining}
                  sx={{
                    background: '#093FB4',
                    borderRadius: '26px',
                    px: 3,
                    py: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    '&:hover': { background: '#004030' },
                  }}
                >
                  <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Continue</Typography>
                </Box>
  </DialogActions>
</Dialog>



<Snackbar
  open={publishSuccessSnackbar.open}
  autoHideDuration={2000}
  onClose={() =>
    setPublishSuccessSnackbar((prev) => ({ ...prev, open: false }))
  }
  message={publishSuccessSnackbar.message}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  ContentProps={{
    sx: {
      backgroundColor: 'green',
      color: '#fff',
      fontWeight: 500,
    },
  }}
/>




    </>
  );
};

<style>
{`
@keyframes loading {
  0% { width: 0%; }
  50% { width: 50%; }
  100% { width: 100%; }
}
`}
</style>


export default PostComposer;
