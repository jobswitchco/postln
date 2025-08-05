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
  useTheme
} from "@mui/material";
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ImageIcon from "@mui/icons-material/Image";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import RewriteAiDialog from "./RewriteAiDialog";
import axios from "axios";
import FullScreenLoader from './FullScreenLoader';


dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);



const AiPostComposer = ({ open, postText, onClose }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [postVisibility, setPostVisibility] = useState("anyone");
const [settingsOpen, setSettingsOpen] = useState(false);
const [scheduleOpen, setScheduleOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState(dayjs());
const [selectedTime, setSelectedTime] = useState("");
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);
const [isRewriteOpen, setIsRewriteOpen] = useState(false);
const [originalPostText, setOriginalPostText] = useState("");
const inputRef = useRef(null);
const [cursorPos, setCursorPos] = useState(0);
const [editedText, setEditedText] = useState(postText || "");
 const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [publishing, setPublishing] = useState(false);
 const [scheduling, setScheduling] = useState(false);
  const [drafting, setDrafting] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";

   const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  






const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    setSelectedImage(URL.createObjectURL(file));
  }
};

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(postText);
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};


const CHARACTER_LIMIT = 2800;
const isCharLimitExceeded =
  postText.length > CHARACTER_LIMIT || editedText.length > CHARACTER_LIMIT;




useEffect(() => {
  if (open) {
    setEditedText(postText || "");
  }
}, [postText, open]);

useEffect(() => {


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


const handlePublish = async () => {
  try {
    setPublishing(true); // Show overlay

    let res;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("postText", editedText);

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
      res = await axios.post(baseUrl + "/publish-text-post", { postText: editedText }, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (res?.data?.published) {
    setPublishing(false);
      onClose("published");
    setSelectedImage(null);
      
}

    setPublishing(false);

  } catch (err) {
    setPublishing(false);
    console.error("Failed to publish:", err.response?.data || err.message);
  }
};

const handleSchedule = async () => {
  try {
    setScheduling(true);

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const scheduledAt = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${selectedTime}`, "YYYY-MM-DD h:mm A")
      .tz(userTimezone)
      .toISOString();

    let res;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("postText", editedText);
      formData.append("scheduledAt", scheduledAt);
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
          postText: editedText,
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
      setScheduling(false);
      onClose("scheduled");
      setScheduleOpen(false);
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
      setDrafting(false);
     onClose("drafted");
      setConfirmOpen(false);
      setSelectedImage(null);
    }

    setDrafting(false);
  } catch (err) {
    setDrafting(false);
    console.error("Failed to save draft:", err.response?.data || err.message);
  }
};


 const handleDiscard = () => {
    setConfirmOpen(false);
    onClose();
  };




  return (
    <>

      {/* Main Dialog */}
       {publishing ? (
       <FullScreenLoader open={publishing} message="Publishing..." />
      ) : (
     <Dialog
  open={open}
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
                    if (postText?.trim?.() === "") {
                    // setOpen(false);        
                    } else {
                    setConfirmOpen(true);    // Content present → ask confirmation
                    }
                }}
                sx={{ position: "absolute", top: 8, right: 8 }}
                >
                <CloseIcon />
                </IconButton>


          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar src={profilePicture} />
            <Stack sx={{ display : 'flex', flexDirection : 'column'}}>

         <Stack sx={{ display: 'flex', flexDirection: 'column' }}>
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
  value={editedText}
  onChange={(e) => {
    setEditedText(e.target.value);
  }}
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






          {/* Bottom Icons + Character Counter */}
       

          {/* Action Buttons */}
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
              }}
            >

                 <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

         <IconButton onClick={handleCopy}>
            <ContentCopyIcon sx={{ fontSize: isMobile ? '20px' : '22px' }}/>
            </IconButton>
            <Snackbar
  open={snackbarOpen}
  autoHideDuration={2000}
  onClose={() => setSnackbarOpen(false)}
  message="Copied!"
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
/>

            <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
                <InsertEmoticonIcon sx={{ fontSize: isMobile ? '20px' : '22px' }}/>
                </IconButton>

           {showEmojiPicker && (
  <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
    <Box sx={{ position: 'absolute', zIndex: 10, top: 160, right: 20 }}>
   <Picker
  data={data}
  onEmojiSelect={(emoji) => {
    if (inputRef.current) {
      const currentText = editedText;
      const emojiChar = emoji.native;
      const before = currentText.slice(0, cursorPos);
      const after = currentText.slice(cursorPos);
      const newText = before + emojiChar + after;

      setEditedText(newText);

      // Set focus back to the input and update cursor
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
  <ImageIcon sx={{ fontSize: isMobile ? '20px' : '22px' }}/>
  <input
    type="file"
    hidden
    accept="image/png, image/jpeg, image/jpg"
    onChange={handleImageSelect}
  />
</IconButton>


  

{postText.length !== 0 && (
  <Typography
    sx={{ ml: "auto", fontSize : isMobile ? '12px' : '14px', fontWeight: 400 }}
    variant="body2"
    color={editedText.length > CHARACTER_LIMIT ? 'error' : 'text.secondary'}
  >
    {editedText.length} / {CHARACTER_LIMIT} characters
  </Typography>
)}
            
          </Box>


          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            mt={1}
          >
           
    <CustomTooltip
  placement="left"
  title={isCharLimitExceeded ? "Exceeded characters" : "Schedule for later"}
>
  <Box
    onClick={() => {
      if (!isCharLimitExceeded && postText?.trim?.() !== '') setScheduleOpen(true);
    }}
    sx={{
      background: postText?.trim?.() === '' || isCharLimitExceeded ? '#C4C4C4' : '#093FB4',
      borderRadius: '4px',
      px: 1,
      py: 0.7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      cursor: postText?.trim?.() === '' || isCharLimitExceeded ? 'not-allowed' : 'pointer',
      pointerEvents: postText?.trim?.() === '' || isCharLimitExceeded ? 'none' : 'auto',
      '&:hover': {
        background: postText?.trim?.() === '' || isCharLimitExceeded ? '#C4C4C4' : '#004030',
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
      if (!isCharLimitExceeded && postText?.trim?.() !== '') handlePublish();
    }}
    sx={{
      background: postText?.trim?.() === '' || isCharLimitExceeded ? '#C4C4C4' : '#093FB4',
      borderRadius: '26px',
      px: 3,
      py: 0.7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      cursor: postText?.trim?.() === '' || isCharLimitExceeded ? 'not-allowed' : 'pointer',
      pointerEvents: postText?.trim?.() === '' || isCharLimitExceeded ? 'none' : 'auto',
      '&:hover': {
        background: postText?.trim?.() === '' || isCharLimitExceeded ? '#C4C4C4' : '#004030',
      },
    }}
  >
    <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Publish</Typography>
  </Box>
</CustomTooltip>

          </Stack>
          </Box>

        </DialogContent>
      </Dialog> )}

      {/* Confirmation Dialog */}
       {drafting ? (
       <FullScreenLoader open={drafting} message="Saving Draft..." />
     
      ) : (
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
       <FullScreenLoader open={scheduling} message="Scheduling post..." />

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
  onClick={handleSchedule}
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
  <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Schedule</Typography>
</Box>
  </DialogActions>
</Dialog> )}

<RewriteAiDialog
  open={isRewriteOpen}
  postText={postText}
  onClose={() => setIsRewriteOpen(false)}
  onReplace={(rewrittenText) => {
    setOriginalPostText(postText);         // store the original post
    // setPostText(rewrittenText);            
    setIsRewriteOpen(false);               // close dialog
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


export default AiPostComposer;
