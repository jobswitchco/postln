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
  Button,
  Grid,
  Divider
} from "@mui/material";
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ImageIcon from "@mui/icons-material/Image";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
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

  // Full-screen composer states
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState("");

  // Image selection (fixed for mobile JFIF/pjpeg)
  const [selectedFile, setSelectedFile] = useState(null);      // File | null
  const [previewUrl, setPreviewUrl] = useState(null);          // string | null

  const [postVisibility, setPostVisibility] = useState("anyone");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const inputRef = useRef(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [editedText, setEditedText] = useState(postText || "");
  const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const baseUrl = "/api/usersOn";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 3 rewritten versions + carousel index
  const [rewrites, setRewrites] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const CHARACTER_LIMIT = 2800;
  const isCharLimitExceeded =
    (postText?.length || 0) > CHARACTER_LIMIT || editedText.length > CHARACTER_LIMIT;

  useEffect(() => {
    if (!open) return;
    if (Array.isArray(postText)) {
      const normalized = postText.map((p) =>
        typeof p === "string" ? { post: p, rating: "" } : p
      );
      setRewrites(normalized);
      setCurrentIdx(0);
    } else if (typeof postText === "string") {
      setEditedText(postText);
    }
  }, [open, postText]);

  // Revoke any old preview URL
  const prevUrlRef = useRef(null);
  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== previewUrl && prevUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = previewUrl;

    return () => {
      if (prevUrlRef.current && prevUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, [previewUrl]);

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

  const getAvailableTimeSlots = (selectedDateValue) => {
    const now = dayjs();
    const selected = dayjs(selectedDateValue).startOf('day');
    let startTime;

    if (selected.isSame(now, 'day')) {
      startTime = now.add(30, 'minute');
      const remainder = 15 - (startTime.minute() % 15);
      startTime = startTime.add(remainder, 'minute');
    } else {
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

  // ---------------- JPEG/JFIF/PJPEG normalizer (client-side fix) ----------------
  const needsJpegNormalization = (file) => {
    const type = (file?.type || "").toLowerCase();
    const name = (file?.name || "").toLowerCase();
    const badMime = type === "image/pjpeg" || type === "image/jfif" || type === "";
    const badExt = name.endsWith(".jfif") || name.endsWith(".pjpeg");
    return badMime || badExt;
  };

  const normalizeJPEGFile = (file) => {
    if (!file) return file;
    if (!needsJpegNormalization(file)) return file;

    const cleanNameBase = (file.name ? file.name.replace(/\.[^/.]+$/, "") : "upload");
    const normalized = new File([file], `${cleanNameBase}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    return normalized;
  };
  // ------------------------------------------------------------------------------

  // MOBILE-SAFE: keep the File and create a preview URL (with normalization)
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    // allow re-picking same file
    if (event.target) event.target.value = null;
    if (!file) return;

    const finalFile = normalizeJPEGFile(file);
    setSelectedFile(finalFile);

    try {
      const url = URL.createObjectURL(finalFile);
      setPreviewUrl(url);
    } catch (e) {
      console.error("Failed to preview image:", e);
      setPreviewUrl(null);
    }
  };

  const clearSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy ?? editedText ?? postText ?? "");
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      let res;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("postText", editedText);
        // pass a stable .jpg filename to satisfy strict backends
        const fname = selectedFile.name || "upload.jpg";
        formData.append("image", selectedFile, fname);

        res = await axios.post(baseUrl + "/publish-media-post", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(
          baseUrl + "/publish-text-post",
          { postText: editedText },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
      }

      if (res?.data?.published) {
        setPublishing(false);
        onClose("published");
        clearSelectedImage();
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

      const scheduledAt = dayjs(
        `${selectedDate.format("YYYY-MM-DD")} ${selectedTime}`,
        "YYYY-MM-DD h:mm A"
      )
        .tz(userTimezone)
        .toISOString();

      let res;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("postText", editedText);
        formData.append("schedule_at", scheduledAt);
        formData.append("postType", "media");
        const fname = selectedFile.name || "upload.jpg";
        formData.append("image", selectedFile, fname);

        res = await axios.post(`${baseUrl}/schedule-media-post`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(
          `${baseUrl}/schedule-text-post`,
          { postText: editedText, scheduledAt, postType: "text" },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
      }

      if (res?.data?.scheduled) {
        setScheduling(false);
        onClose("scheduled");
        setScheduleOpen(false);
        clearSelectedImage();
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

      if (selectedFile) {
        const formData = new FormData();
        formData.append("postText", editedText);
        formData.append("postType", "media");
        const fname = selectedFile.name || "upload.jpg";
        formData.append("image", selectedFile, fname);

        res = await axios.post(`${baseUrl}/save-draft-media-post`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(
          `${baseUrl}/save-draft-text-post`,
          { postText: editedText, postType: "text" },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
      }

      if (res?.data?.draftSaved) {
        setDrafting(false);
        onClose("drafted");
        setConfirmOpen(false);
        clearSelectedImage();
      }

      setDrafting(false);
    } catch (err) {
      setDrafting(false);
      console.error("Failed to save draft:", err.response?.data || err.message);
    }
  };

  const handleDiscard = () => {
    setConfirmOpen(false);
    setComposerOpen(false);
  };

  // Carousel (mobile)
  const prevCard = () => setCurrentIdx((p) => (p - 1 + rewrites.length) % rewrites.length);
  const nextCard = () => setCurrentIdx((p) => (p + 1) % rewrites.length);

  // Open composer helper
  const openComposer = (text) => {
    const t = text ?? "";
    setComposerText(t);
    setEditedText(t);
    setComposerOpen(true);
    setShowEmojiPicker(false);
  };

  const VersionCard = ({ index, item }) => {
    const text = typeof item === "string" ? item : item?.post || "";
    return (
      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography sx={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 600, color: 'grey' }}>
              Version {index + 1}
            </Typography>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            onClick={() => openComposer(text)}
            variant="contained"
            sx={{
              backgroundColor: '#093FB4',
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              boxShadow: '0px 3px 6px rgba(0,0,0,0.15)',
              '&:hover': { backgroundColor: '#004030' },
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
      {/* Main Dialog: shows versions / carousel */}
      {publishing ? (
        <FullScreenLoader open={publishing} message="Publishing..." />
      ) : (
        <Dialog
          open={open}
          onClose={onClose}
          fullScreen
          disableEscapeKeyDown
          hideBackdrop={false}
          PaperProps={{
            sx: {
              m: 0,
              height: '100vh',
              maxHeight: '100vh',
              width: '100vw',
              maxWidth: '100vw',
              borderRadius: 0
            },
          }}
        >
          <DialogContent sx={{ position: "relative", pt: 4, pb: 10 }}>
            {/* Close Icon */}
            <IconButton
              onClick={() => onClose && onClose()}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <CloseIcon />
            </IconButton>

            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar src={profilePicture} />
              <Stack sx={{ display: 'flex', flexDirection: 'column' }}>
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

            {/* Rewritten versions */}
            <Box sx={{ mt: 3 }}>
              {!isMobile && (
                <Grid container spacing={2}>
                  {rewrites.map((item, i) => (
                    <Grid key={i} item xs={12} md={4}>
                      <VersionCard index={i} item={item} />
                    </Grid>
                  ))}
                </Grid>
              )}

              {isMobile && (
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ px: 1 }}>
                    {rewrites.length > 0 && (
                      <VersionCard index={currentIdx} item={rewrites[currentIdx]} />
                    )}
                  </Box>

                  {rewrites.length > 1 && (
                    <>
                      <IconButton aria-label="Previous version" onClick={prevCard} sx={{ position: 'absolute', top: '50%', left: -8, transform: 'translateY(-50%)' }}>
                        <ChevronLeftIcon />
                      </IconButton>
                      <IconButton aria-label="Next version" onClick={nextCard} sx={{ position: 'absolute', top: '50%', right: -8, transform: 'translateY(-50%)' }}>
                        <ChevronRightIcon />
                      </IconButton>
                    </>
                  )}

                  {rewrites.length > 1 && (
                    <Stack direction="row" spacing={1} mt={1} justifyContent="center">
                      {rewrites.map((_, i) => (
                        <Box
                          key={i}
                          onClick={() => setCurrentIdx(i)}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            bgcolor: i === currentIdx ? 'primary.main' : 'grey.400'
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      {drafting ? (
        <FullScreenLoader open={drafting} message="Saving Draft..." />
      ) : (
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 500 }}>
            Save this post as a draft?
            <IconButton aria-label="close" onClick={() => setConfirmOpen(false)} sx={{ color: (themeVar) => themeVar.palette.grey[500] }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: '16px' }}>The post you started will be here when you return.</Typography>
          </DialogContent>
          <DialogActions sx={{ py: 3, px: 3 }}>
            <Box
              onClick={handleDiscard}
              sx={{
                background: '#D7D7D7', borderRadius: '26px', px: 3, py: 0.7, cursor: 'pointer',
                '&:hover': { background: '#748873', color: '#FFFFFF' }
              }}
            >
              <Typography sx={{ fontSize: '16px' }}>Discard</Typography>
            </Box>
            <Box
              onClick={handleSaveDraft}
              sx={{
                background: composerText?.trim?.() === '' ? '#C4C4C4' : '#093FB4',
                borderRadius: '26px', px: 3, py: 0.7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF',
                cursor: composerText?.trim?.() === '' ? 'not-allowed' : 'pointer',
                pointerEvents: composerText?.trim?.() === '' ? 'none' : 'auto',
                '&:hover': { background: composerText?.trim?.() === '' ? '#C4C4C4' : '#004030' }
              }}
            >
              <Typography sx={{ fontSize: '16px' }}>Save as draft</Typography>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* Post settings dialog */}
      <Dialog open={settingsOpen} onClose={() => {}} disableEscapeKeyDown hideBackdrop={false} fullWidth maxWidth="xs">
        <DialogTitle>
          <Stack sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>Post settings</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>Who can see your post?</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box
              onClick={() => setPostVisibility("anyone")}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderRadius: 2, cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ background: '#EAEFEF', p: 1, borderRadius: '100%' }}>
                  <PublicOutlinedIcon sx={{ fontSize: '26px', color: '#000000' }} />
                </Box>
                <Box>
                  <Typography fontWeight={500} fontSize={16}>Anyone</Typography>
                  <Typography fontSize={13} color="text.secondary">Anyone on or off LinkedIn</Typography>
                </Box>
              </Stack>
              <Radio checked={postVisibility === "anyone"} sx={{ color: "#1976d2", "&.Mui-checked": { color: "#093FB4" }, transform: "scale(1.2)" }} disableRipple />
            </Box>

            <Box
              onClick={() => setPostVisibility("connections")}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderRadius: 2, cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ background: '#EAEFEF', p: 1, borderRadius: '100%' }}>
                  <GroupAddOutlinedIcon sx={{ fontSize: '26px', color: '#000000' }} />
                </Box>
                <Box>
                  <Typography fontWeight={500} fontSize={16}>Connections only</Typography>
                  <Typography fontSize={13} color="text.secondary">Only your LinkedIn connections</Typography>
                </Box>
              </Stack>
              <Radio checked={postVisibility === "connections"} sx={{ color: "#1976d2", "&.Mui-checked": { color: "#093FB4" }, transform: "scale(1.2)" }} disableRipple />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ py: 3, px: 2 }}>
          <Box onClick={() => setSettingsOpen(false)} sx={{ background: '#D7D7D7', borderRadius: '26px', px: 3, py: 0.7, cursor: 'pointer', '&:hover': { background: '#748873', color: '#FFFFFF' } }}>
            <Typography>Back</Typography>
          </Box>
          <Box onClick={() => setSettingsOpen(false)} sx={{ background: '#093FB4', borderRadius: '26px', px: 3, py: 0.7, color: '#FFFFFF', cursor: 'pointer', '&:hover': { background: '#004030', color: '#FFFFFF' } }}>
            <Typography>Done</Typography>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Schedule dialog */}
      {scheduling ? (
        <FullScreenLoader open={scheduling} message="Scheduling post..." />
      ) : (
        <Dialog open={scheduleOpen} onClose={() => {}} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle>Schedule post</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" sx={{ mb: 4 }}></Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                disablePast
                minDate={dayjs()}
              />
            </LocalizationProvider>
            <FormControl fullWidth={false} sx={{ mt: 3, width: isMobile ? '90%' : '400px' }}>
              <Select
                value={selectedTime}
                displayEmpty
                onChange={(e) => setSelectedTime(e.target.value)}
                renderValue={(selected) => selected ? selected : <Typography color="text.secondary">Time</Typography>}
              >
                {getAvailableTimeSlots(selectedDate).map((slot) => (
                  <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3 }}>
            <Box onClick={() => setScheduleOpen(false)} sx={{ background: '#D7D7D7', borderRadius: '26px', px: 3, py: 0.7, cursor: 'pointer', '&:hover': { background: '#748873', color: '#FFFFFF' } }}>
              <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Back</Typography>
            </Box>
            <Box
              onClick={handleSchedule}
              sx={{
                background: composerText?.trim?.() === '' ? '#C4C4C4' : '#093FB4',
                borderRadius: '26px',
                px: 3,
                py: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: composerText?.trim?.() === '' ? 'not-allowed' : 'pointer',
                pointerEvents: composerText?.trim?.() === '' ? 'none' : 'auto',
                '&:hover': { background: composerText?.trim?.() === '' ? '#C4C4C4' : '#004030' }
              }}
            >
              <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Schedule</Typography>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* Rewrite dialog -> open composer with the chosen version */}
      <RewriteAiDialog
        open={isRewriteOpen}
        onClose={() => setIsRewriteOpen(false)}
        onReplace={(result) => {
          setIsRewriteOpen(false);
          const pick = Array.isArray(result)
            ? (typeof result[0] === "string" ? result[0] : (result[0] && result[0].post) ? result[0].post : "")
            : (typeof result === "string" ? result : (result && result.post) ? result.post : "");
          openComposer(pick);
        }}
      />

      {/* Composer dialog */}
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

            {/* Editor */}
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

            {/* Image preview */}
            {previewUrl && (
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
                    src={previewUrl}
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
                    onClick={clearSelectedImage}
                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'white' }}
                    aria-label="Remove image"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Bottom bar */}
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
                    accept="image/*"
                    onChange={handleImageSelect}
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
                        setScheduleOpen(true);
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
                        handlePublish();
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

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 50%; }
          100% { width: 100%; }
        }
      `}</style>
    </>
  );
};

export default AiPostComposer;
