import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  MenuItem,
  FormControl,
  Select,
  Typography,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import axios from "axios";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

const getAvailableTimeSlots = (selectedDate) => {
  const slots = [];
  const now = dayjs();
  const isToday = selectedDate.isSame(now, "day");
  const startMinute = isToday
    ? Math.ceil((now.add(30, "minute").hour() * 60 + now.add(30, "minute").minute()) / 15) * 15
    : 0;

  for (let minutes = startMinute; minutes < 24 * 60; minutes += 15) {
    const slot = selectedDate.startOf("day").add(minutes, "minute");
    slots.push(slot.format("hh:mm A"));
  }

  return slots;
};


const EditScheduledPost = ({
  open,
  setOpen,
  initialPostText = "",
  initialMediaUrl = "",
  initialPublishAt = "",
  document_id = ""
}) => {
  const inputRef = useRef(null);
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";


  const initialDayjs = initialPublishAt ? dayjs(initialPublishAt) : dayjs().add(30, 'minute');
  const [postText, setPostText] = useState(initialPostText);
  const [selectedImage, setSelectedImage] = useState(initialMediaUrl || null);
  const [selectedDate, setSelectedDate] = useState(initialDayjs.startOf("day"));
  const [selectedTime, setSelectedTime] = useState(initialDayjs.format("hh:mm A"));

  useEffect(() => {
    if (open) {
      setPostText(initialPostText);
      setSelectedImage(initialMediaUrl || null);
      const parsed = dayjs(initialPublishAt);
      setSelectedDate(parsed.startOf("day"));
      setSelectedTime(parsed.format("hh:mm A"));
    }
  }, [open, initialPostText, initialMediaUrl, initialPublishAt]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

 const handleUpdatePost = async () => {
  const [hour, minuteStr, meridian] = selectedTime.split(/:| /);
  const hour24 = meridian === "PM" ? ((+hour % 12) + 12) : (+hour % 12);
  const minute = parseInt(minuteStr, 10);
  const finalDateTime = selectedDate.set("hour", hour24).set("minute", minute).set("second", 0);

  const updatedFields = {};
  const isPostTextChanged = postText !== initialPostText;
  const isDateTimeChanged = !dayjs(initialPublishAt).isSame(finalDateTime);
  const isImageChanged = selectedImage && selectedImage !== initialMediaUrl;

  if (!isPostTextChanged && !isDateTimeChanged && !isImageChanged) {
    setOpen(false);
    return;
  }

  try {
    // Step 1: If image changed, upload it first and get URL
    let uploadedImageUrl = null;
    if (isImageChanged && selectedImage && selectedImage.startsWith("blob:")) {
      const blob = await fetch(selectedImage).then(res => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "post-image.jpg");

      const imageRes = await axios.post(`${baseUrl}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      uploadedImageUrl = imageRes.data.mediaUrl;
    }

    // Step 2: Prepare updated fields
    if (isPostTextChanged) updatedFields.postText = postText;
    if (isDateTimeChanged) updatedFields.modifiedDate = finalDateTime.toISOString();
    if (uploadedImageUrl) updatedFields.mediaUrl = uploadedImageUrl;

    // Step 3: Send final update if there's anything to update
    const res = await axios.post(
      `${baseUrl}/update-linkedin-post`,
      {
        document_id,
        ...updatedFields,
      },
      { withCredentials: true }
    );

    console.log("Post updated:", res.data);
  } catch (err) {
    console.error("Failed to update post", err);
  } finally {
    setOpen(false);
  }
};


  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Post</DialogTitle>
      <DialogContent>
        <TextField
          multiline
          minRows={6}
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          inputRef={inputRef}
          placeholder="Share your thoughts..."
          fullWidth
        />

        {selectedImage && (
          <Box mt={2}>
            <img src={selectedImage} alt="preview" style={{ width: '100%', borderRadius: 8 }} />
          </Box>
        )}

        <Box mt={2}>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            hidden
            id="upload-img"
            onChange={handleImageSelect}
          />
          <label htmlFor="upload-img">
            <IconButton component="span">
              <ImageIcon />
            </IconButton>
          </label>
        </Box>

      
      </DialogContent>

     <DialogActions sx={{ px: 3, py: 3}}>
  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
    {/* Left side: Date + Time */}
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display="flex" gap={2} alignItems="center">
        <DatePicker
          label="Scheduled Date"
          value={selectedDate}
          onChange={(newDate) => setSelectedDate(newDate.startOf("day"))}
          disablePast
          minDate={dayjs()}
          slotProps={{ textField: { size: "small", sx: { minWidth: 130 } } }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            displayEmpty
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
      </Box>
    </LocalizationProvider>

    {/* Right side: Cancel + Update */}
    <Box display="flex" gap={2}>
      <Button onClick={handleClose}>Cancel</Button>
      <Button
        onClick={handleUpdatePost}
        sx={{
          backgroundColor: "#1976d2",
          color: "#fff",
          textTransform: 'none',
          fontSize: '16px',
          px: 3,
          "&:hover": { backgroundColor: "#1565c0" },
        }}
      >
        Schedule Post
      </Button>
    </Box>
  </Box>
</DialogActions>

    </Dialog>
  );
};

export default EditScheduledPost;
