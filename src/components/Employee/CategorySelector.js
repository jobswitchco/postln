import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Stack,
  OutlinedInput,
  Tooltip,
   useMediaQuery,
  useTheme,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import logo from "../../images/postln_logo.svg";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/professionalSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

function CategorySelector() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopicSave, setShowTopicSave] = useState(false);
   const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axios.post(baseUrl + "/logout", {}, { withCredentials: true });
      dispatch(logout());
      window.location.href = "/professional/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

useEffect(() => {
  const init = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch categories
      const res = await axios.get(baseUrl + "/get-categories", {
        withCredentials: true,
      });
      setCategories(res.data.categories || []);

      // 2. Check post analysis status
      const postAnalysisStatus = await axios.get(
        baseUrl + "/are-posts-analyzed",
        { withCredentials: true }
      );

      if (postAnalysisStatus.data.success && postAnalysisStatus.data.profile_added) {
        // ✅ user already added topics, skip to analysis page
        navigate("/professional/dashboard");
      }

    } catch (err) {
      toast.error("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  init();
}, [navigate]);


const handleCategoryChange = async (event) => {
  const newSelected = event.target.value;
  setSelectedCategoryIds(newSelected);
  setTopics([]);
  setSelectedTopics([]);
  setShowTopicSave(false);

  // ✅ Fetch topics only if at least one category is selected
  if (newSelected.length === 0) return;

  try {
    const res = await axios.post(
      baseUrl + "/save-selected-category",
      { categoryIds: newSelected },
      { withCredentials: true }
    );

    if (res.data.success && Array.isArray(res.data.topics)) {
  const sortedTopics = res.data.topics.sort((a, b) => a.localeCompare(b));
  setTopics(sortedTopics);
}

  } catch (err) {
    toast.error("Failed to fetch topics.");
  }
};


  const handleRemoveCategory = (categoryIdToRemove) => {
    const updated = selectedCategoryIds.filter((id) => id !== categoryIdToRemove);
    setSelectedCategoryIds(updated);
    setTopics([]);
    setSelectedTopics([]);
    setShowTopicSave(false);
  };

  const toggleTopic = (topic) => {
    let updatedTopics;
    if (selectedTopics.includes(topic)) {
      updatedTopics = selectedTopics.filter((t) => t !== topic);
    } else {
      updatedTopics = [...selectedTopics, topic];
    }
    setSelectedTopics(updatedTopics);
    setShowTopicSave(updatedTopics.length > 0);
  };

const handleTopicSave = async () => {
  try {
    const response = await axios.post(
      baseUrl + "/save-selected-topics",
      { topics: selectedTopics },
      { withCredentials: true }
    );

    if (response.data.success) {

        toast.success("Topics saved successfully!");

        const postAnalysisStatus = await axios.get(
          baseUrl + "/are-posts-analyzed",
          { withCredentials: true }
        );

        if (postAnalysisStatus.data.success && postAnalysisStatus.data.profile_added) {
            navigate("/professional/dashboard");
          } else {
          }
        } else {
          // Fallback if post analysis check fails
        toast.error("Network Error! Please try again.");

        }

  } catch (err) {
    toast.error("Failed to save topics.");
  }
};


  if (isLoading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" px={4} py={2} mt={4}>
   <header
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F5F7F8",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 50,
  }}
>
  <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
    <img src={logo} alt="PostLn Logo" width="40" height="auto" style={{ display: "block" }} />
    <div style={{ marginLeft: 2, fontWeight: 600, fontSize: "1.2rem" }}>PostLn</div>
  </Link>

  <Button
    onClick={handleLogout}
    variant="text"
    sx={{ color: "grey", ":hover": { color: "#000000" }, textTransform: "none" }}
  >
    Logout
  </Button>
</header>

      </Box>

      {/* Category Selection */}
      <Box display="flex" flexDirection="column" alignItems="center" mt={4} px={2}>
      <Typography sx={{ fontSize: { xs: '16px', sm: '20px' }, fontWeight: 500, mb: 3 }}>
        What Describes You Best?
      </Typography>

      <FormControl sx={{ width: { xs: '100%', sm: 500 } }}>
        <InputLabel id="category-label">I'm A</InputLabel>
        <Select
          labelId="category-label"
          multiple
          value={selectedCategoryIds}
          onChange={handleCategoryChange}
          input={<OutlinedInput label="I'm A" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((id) => {
                const category = categories.find((c) => c._id === id);
                return (
                  <Chip
                    key={id}
                    label={category?.category}
                    onDelete={() => handleRemoveCategory(id)}
                    deleteIcon={<CancelIcon />}
                    sx={{ fontSize : isMobile ? '12px' : '14px'}}
                  />
                );
              })}
            </Box>
          )}
        >
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              {cat.category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Topic Selection */}
      {topics.length > 0 && (
        <Box mt={5} mb={5} textAlign="center" px={ isMobile ? 1 : 2}>
          <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 500, mb: 3 }}>
            What topics do You Love Talking about?
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {topics.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                variant={selectedTopics.includes(topic) ? 'filled' : 'outlined'}
                onClick={() => toggleTopic(topic)}
                sx={{
                  fontSize: { xs: '14px', sm: '16px' },
                  px: 1,
                  borderRadius: '999px',
                  cursor: 'pointer',
                  backgroundColor: selectedTopics.includes(topic) ? '#06923E' : 'transparent',
                  color: selectedTopics.includes(topic) ? '#fff' : '#000',
                  borderColor: '#ccc',
                  '&:hover': {
                    backgroundColor: selectedTopics.includes(topic) ? '#06923E' : '#f1f1f1',
                  },
                }}
              />
            ))}
          </Stack>

          {showTopicSave && (
            <Box mt={4}>
              <Tooltip
                title={
                  selectedTopics.length < 5
                    ? 'At least 5 topics required'
                    : ''
                }
                placement="top"
                arrow
                disableHoverListener={selectedTopics.length >= 5}
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleTopicSave}
                    disabled={selectedTopics.length < 5}
                    sx={{
                      borderRadius: '24px',
                      backgroundColor: '#362FD9',
                      textTransform: 'none',
                      px: isMobile ? 2 : 4,
                      py: 1.2,
                      fontSize: { xs: '14px', sm: '16px' },
                      width: isMobile ? '80%' : 'auto',
                    }}
                  >
                    Save Topics
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}
    </Box>
    </Box>
  );
}

export default CategorySelector;
