import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Badge,
  Stack,
  Grid,
  Paper,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  StaticDatePicker,
  PickersDay,
} from "@mui/x-date-pickers";
import {
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
  format,
} from "date-fns";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EditScheduledPost from "./EditPublishedPost";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyPosts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [postsByType, setPostsByType] = useState({
    Published: [],
    Scheduled: [],
    Drafts: [],
    Errored: [],
  });
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const scheduledDates = postsByType.Scheduled.map(p =>
    new Date(p.scheduledFor || p.publish_at)
  );
  const publishedDates = postsByType.Published.map(p =>
    new Date(p.created_at || p.date)
  );

  const today = startOfDay(new Date());
  const selectedDayStart = startOfDay(selectedDate);
  const isPast = isBefore(selectedDayStart, today);
  const isFuture = isAfter(selectedDayStart, today);
  const isTodaySelected = isToday(selectedDate);

  const dynamicTabs = [];

  if (!isFuture || isTodaySelected) {
    dynamicTabs.push({
      label: "Published",
      count: publishedDates.filter(d => isSameDay(d, selectedDate)).length,
    });
  }
  if (!isPast) {
    dynamicTabs.push({
      label: "Scheduled",
      count: scheduledDates.filter(d => isSameDay(d, selectedDate)).length,
    });
  }
  dynamicTabs.push({
    label: "Drafts",
    count: postsByType.Drafts.length,
  });
  dynamicTabs.push({
    label: "Errored",
    count: postsByType.Errored.length,
  });

  const handleTabChange = (_, newValue) => setTabIndex(newValue);

  const getDateColor = day => {
    const isScheduled = scheduledDates.some(d => isSameDay(d, day));
    if (isScheduled) return "#FDD835";
    const isPublished = publishedDates.some(d => isSameDay(d, day));
    if (isPublished) return "#4CAF50";
    if (isToday(day)) return "#E3F2FD";
    return null;
  };

  const renderCustomDay = (day, _selectedDates, pickersDayProps) => {
    const dateBg = getDateColor(day);
    const overrideSelection = !!dateBg;
    return (
      <PickersDay
        {...pickersDayProps}
        disableMargin
        selected={!overrideSelection && isSameDay(day, selectedDate)}
        sx={{
          width: 36,
          height: 36,
          margin: "2px",
          fontSize: "14px",
          ...(dateBg && {
            backgroundColor: dateBg,
            color: dateBg === "#FDD835" ? "#000" : "#fff",
            borderRadius: "50%",
            "&:hover": { backgroundColor: dateBg },
            "&.Mui-selected": { backgroundColor: dateBg },
          }),
        }}
      />
    );
  };

  const fetchPosts = async (dateToFetch) => {
    const localStart = new Date(dateToFetch);
    localStart.setHours(0, 0, 0, 0);
    const localEnd = new Date(dateToFetch);
    localEnd.setHours(23, 59, 59, 999);
    try {
      const res = await axios.post(
        baseUrl + '/get-user-posts-by-date',
        { start: localStart.toISOString(), end: localEnd.toISOString() },
        { withCredentials: true }
      );
      setPostsByType(res.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts(selectedDate);
  }, [selectedDate]);

  const handleDeletePost = async (postId) => {
    try {
      const res = await axios.post(
        baseUrl + '/delete-draft-post',
        { postId },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success("Post deleted");
        fetchPosts(selectedDate);
      } else {
        toast.error("Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Error deleting post");
    }
  };

  const renderPosts = () => {
    const activeTab = dynamicTabs[tabIndex]?.label;
    let filtered = [];

    if (activeTab === "Scheduled") {
      filtered = postsByType.Scheduled.filter(p =>
        isSameDay(new Date(p.scheduledFor || p.publish_at), selectedDate)
      );
    } else if (activeTab === "Published") {
      filtered = postsByType.Published.filter(p =>
        isSameDay(new Date(p.created_at || p.date), selectedDate)
      );
    } else if (activeTab === "Drafts") {
      const drafts = postsByType.Drafts;
      if (drafts.length === 0) {
        return <Typography>No draft posts saved.</Typography>;
      }
      return (
        <Grid container spacing={2}>
          {drafts.map((post, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Saved At: {post.created_at ? format(new Date(post.created_at), "hh:mm a") : ""}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" onClick={() => {
                        setPostToEdit({
                          postText: post.postText,
                          mediaUrl: post.media_url || '',
                          document_id: post._id,
                        });
                        setEditDialogOpen(true);
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePost(post._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Typography sx={{ fontSize: isMobile ? '15px' : '16px', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {post.postText}
                  </Typography>
                  {post.media_url && (
                    <Box mt={2}>
                      <img
                        src={post.media_url}
                        alt="draft media"
                        style={{ maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    } else if (activeTab === "Errored") {
      return <Typography>{postsByType.Errored.length} error posts found.</Typography>;
    }

    if (filtered.length === 0) {
      return <Typography>No {activeTab.toLowerCase()} posts on {selectedDate.toDateString()}.</Typography>;
    }

    return (
      <Grid container spacing={2}>
        {filtered.map((post, idx) => {
          const isScheduled = activeTab === "Scheduled";
          const displayTime = isScheduled ? post.publish_at : post.created_at;
          const formattedTime = displayTime ? format(new Date(displayTime), "hh:mm a") : "";

          return (
            <Grid item xs={12} sm={6} key={idx}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      {isScheduled ? "Scheduled to post:" : "Published At:"} {formattedTime}
                    </Typography>
                    {isScheduled && (
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => {
                          setPostToEdit({
                            postText: post.postText,
                            mediaUrl: post.media_url || '',
                            document_id: post._id,
                            publishAt: post.publish_at,
                          });
                          setEditDialogOpen(true);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: isMobile ? '15px' : '16px', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {post.postText}
                  </Typography>
                  {post.media_url && (
                    <Box mt={2}>
                      <img
                        src={post.media_url}
                        alt="post media"
                        style={{ maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <>
      <Box>
        <Grid container spacing={3}>
          {/* Calendar Column */}
          <Grid item xs={12} sm={4} md={4}>
            {isMobile ? (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setCalendarDialogOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 500 }}
                >
                  {format(selectedDate, "dd/MM/yyyy")}
                </Button>
                <Dialog open={calendarDialogOpen} onClose={() => setCalendarDialogOpen(false)}>
                  <DialogTitle>Select a date</DialogTitle>
                  <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <StaticDatePicker
                        value={selectedDate}
                        onChange={(newVal) => {
                          if (!isNaN(new Date(newVal))) setSelectedDate(newVal);
                          setCalendarDialogOpen(false);
                        }}
                        displayStaticWrapperAs="desktop"
                        showDaysOutsideCurrentMonth
                        slots={{
                          day: (props) => renderCustomDay(props.day, selectedDate, props),
                        }}
                      />
                    </LocalizationProvider>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Paper
  elevation={3}
  sx={{
    borderRadius: 2,
    overflow: 'hidden',
    '& .MuiPickerStaticWrapper-root': {
      overflow: 'hidden !important',
      maxHeight: 'unset !important',
    },
    '& .MuiDateCalendar-root': {
      overflow: 'hidden !important',
      maxHeight: 'unset !important',
    },
    '& .MuiDayCalendar-slideTransition': {
      overflow: 'hidden !important',
      maxHeight: 'unset !important',
    },
    '& .MuiDayCalendar-monthContainer': {
      overflow: 'hidden !important',
    },
  }}
>
  <StaticDatePicker
    value={selectedDate}
    onChange={(newVal) => {
      if (!isNaN(new Date(newVal))) setSelectedDate(newVal);
    }}
    displayStaticWrapperAs="desktop"
    showDaysOutsideCurrentMonth
    slots={{
      day: (props) => renderCustomDay(props.day, selectedDate, props),
    }}
  />
</Paper>


                {/* Date legends for non-mobile */}
                <Stack spacing={1} mt={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ height: 18, width: 18, borderRadius: "50%", background: "#FDD835" }}></Box>
                    <Typography fontSize="14px" color="grey">Dates with Scheduled posts</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ height: 18, width: 18, borderRadius: "50%", background: "#4CAF50" }}></Box>
                    <Typography fontSize="14px" color="grey">Dates with Published posts</Typography>
                  </Stack>
                </Stack>
              </LocalizationProvider>
            )}
          </Grid>

          {/* Right: Tabs & Posts */}
          <Grid item xs={12} sm={8} md={8}>
            <Box sx={{ position: "sticky", top: isMobile ? 56 : 0, zIndex: 1000, pb: 1 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, "& .MuiTabs-flexContainer": { gap: 1 } }}
                TabIndicatorProps={{ style: { display: "none" } }}
              >
                {dynamicTabs.map((tab, index) => (
                  <Tab
                    key={tab.label}
                    disableRipple
                    label={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <span>{tab.label}</span>
                        <Badge
                          badgeContent={tab.count}
                          max={99}
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "12px",
                              minWidth: "20px",
                              height: "20px",
                              borderRadius: "10px",
                            },
                          }}
                        />
                      </Stack>
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      px: 2.5,
                      borderRadius: "8px",
                      bgcolor: tabIndex === index ? "#E5EDFF" : "#F2F4F7",
                      color: tabIndex === index ? "#093FB4" : "#344054",
                      "&:hover": { bgcolor: "#e3e8f0" },
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            <Box sx={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto", pb: 2 }}>
              {renderPosts()}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {postToEdit && (
        <EditScheduledPost
          open={editDialogOpen}
          setOpen={setEditDialogOpen}
          initialPostText={postToEdit.postText}
          initialMediaUrl={postToEdit.mediaUrl}
          initialPublishAt={postToEdit.publishAt}
          document_id={postToEdit.document_id}
        />
      )}
    </>
  );
};

export default MyPosts;
