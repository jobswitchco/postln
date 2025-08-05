import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  ToggleButton, ToggleButtonGroup, Skeleton, Button, Menu, MenuItem, useMediaQuery, useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GenerateWithAI from "./GenerateWithAI";
import AiPostComposer from "./AiPostComposer";
import axios from "axios";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";


countries.registerLocale(enLocale);

const countryOptions = Object.entries(
  countries.getNames("en", { select: "official" })
).map(([code, name]) => ({ code, name }));


const truncate = (text, limit = 460) =>
  text.length > limit ? text.slice(0, limit) + "..." : text;

export default function TopicNewsGrid() {
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [postText, setPostText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";

  const [selectedRegion, setSelectedRegion] = useState("IN");
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'info', // success | info | warning
});
const [articles, setArticles] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
const [showAllCards, setShowAllCards] = useState(false);

const [anchorEl, setAnchorEl] = useState(null);
const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleCountryChange = (code) => {
    setSelectedRegion(code);
    setArticles([]);
    setPage(1);
    handleClose();
  };


const escapeHtml = (unsafe = "") =>
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderFormattedSummary = (summary) => {
  if (!summary || typeof summary !== "string") return null;

  const lines = summary.trim().split("\n");

  return lines.map((line, index) => {
    const safeLine = escapeHtml(line.trim());

    // ### Heading
    if (safeLine.startsWith("### ")) {
      return (
        <Typography
          key={index}
          sx={{ fontSize: "14px", fontWeight: 500, mt: 2 }}
        >
          {safeLine.replace("### ", "")}
        </Typography>
      );
    }

    // - **Title**: Value
    if (/^- \*\*(.+?)\*\*:/.test(safeLine)) {
      const match = safeLine.match(/^- \*\*(.+?)\*\*: (.+)/);
      if (!match) return null;

      const [_, boldTitle, rest] = match;

      return (
        <Box
          key={index}
          sx={{ display: "flex", alignItems: "flex-start", mt: 1 }}
        >
          <Typography sx={{ mr: 1 }}>•</Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
            {boldTitle}:{" "}
            <Box component="span" sx={{ fontWeight: 400 }}>
              {rest}
            </Box>
          </Typography>
        </Box>
      );
    }

    // - Bullet points (with optional **bold** inside)
    if (safeLine.startsWith("- ")) {
      const bulletText = safeLine.slice(2).replace(
        /\*\*(.+?)\*\*/g,
        `<span style='font-weight: 500;'>$1</span>`
      );

      return (
        <Box
          key={index}
          sx={{ display: "flex", alignItems: "flex-start", mt: 1 }}
        >
          <Typography sx={{ mr: 1 }}>•</Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 400,
              whiteSpace: "pre-line",
            }}
            dangerouslySetInnerHTML={{ __html: bulletText }}
          />
        </Box>
      );
    }

    // Normal line with optional **bold**
    const normalLine = safeLine.replace(
      /\*\*(.+?)\*\*/g,
      `<span style='font-weight: 500;'>$1</span>`
    );

    return (
      <Typography
        key={index}
        sx={{ fontSize: "14px", fontWeight: 400, mt: 1, whiteSpace: "pre-line" }}
        dangerouslySetInnerHTML={{ __html: normalLine }}
      />
    );
  });
};



useEffect(() => {
  if (!isMobile) return;

  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const currentY = window.scrollY;

    // If user scrolls UP
    if (currentY < lastScrollY && !showAllCards) {
      setShowAllCards(true);
    }

    lastScrollY = currentY;
  };

  window.addEventListener("scroll", handleScroll);

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, [isMobile, showAllCards]);



  const handleTabChange = (event, newValue) => {
    setSelectedTopic(newValue);
  };

  const handleCardClick = (article) => {
    setActiveArticle(article);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setActiveArticle(null);
  };



  const fetchUserTopics = async () => {
    try {
      const response = await axios.get(baseUrl + '/get-topics-of-user', {
        withCredentials: true,
      });

      const fetchedTopics = response.data.result || [];
      setTopics(fetchedTopics);

      const preselected = fetchedTopics.filter(t => t.selected).map(t => t.name);
      setSelectedTopics(preselected);

      const firstSelected = fetchedTopics.find((t) => t.selected);
      if (firstSelected) {
        setSelectedTopic(firstSelected.name);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchArticles = async (page = 1) => {
  try {

    setLoading(true);
    const response = await axios.post(baseUrl + "/fetch-articles-for-user", {
      topic: selectedTopic,     // e.g., "LinkedIn"
      region: selectedRegion,   // e.g., "IN"
      page: page,               // pagination
      limit: 9,                 // always fetch 9
    }, {withCredentials : true});
    
    // console.log('Data::::::::', response.data.data);

    const newArticles = response.data?.data || [];

    // Append to state
    setArticles((prev) => [...prev, ...newArticles]);

    // Pagination control
    setPage(page);
    setHasMore(newArticles.length === 9); // If fewer than 9, no more left
    setLoading(false);
  } catch (error) {
    console.error("Error fetching articles:", error);
    setHasMore(false);
  }
};

useEffect(() => {
    const detectRegionAndLoad = async () => {
      try {
        const res = await axios.get(baseUrl + "/get-location-from-ip");
        const { country_code } = res.data;
        setSelectedRegion(country_code || "IN");
      } catch (err) {
        console.error("Error detecting location:", err);
      }
    };
    fetchUserTopics();
    detectRegionAndLoad();
  }, []);

 useEffect(() => {
    if (selectedTopic && selectedRegion && page === 1) {
      fetchArticles(1);
    }
  }, [selectedTopic, selectedRegion]);

// When user changes topic/region manually, reset page and articles
 useEffect(() => {
    if (selectedTopic && selectedRegion) {
      setArticles([]);
      setPage(1);
    }
  }, [selectedTopic, selectedRegion]);


  const saveUserTopics = async () => {
    try {
      const response = await axios.post(
        baseUrl + '/update-topics-of-user',
        { selectedTopics },
        { withCredentials: true }
      );

      if (response.data.updated) {
        setSelectedTopics(response.data.topics);
        setShowTopicDialog(false);
        fetchUserTopics();
      }
    } catch (error) {
      console.error("Error saving topics:", error);
    }
  };

  return (
    <>
      <Box sx={{mt: 4 }}>
       <Box
    sx={{
      position: "sticky",
      top: 0,
      backgroundColor: "#222831",
      py: 2,
       boxShadow: "0px 4px 8px -2px rgba(0,0,0,0.08)",
       px: 2,
       width: '100%',
       borderTopLeftRadius: '22px',
       borderTopRightRadius: '22px',
       mb: 1

    }}
  >
    <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
     
     {isMobile ? (
        <Typography sx={{ fontSize: isMobile ? "14px" : "18px", fontWeight: 500 , color: '#FFFFFF'}}>
      Live & Trending Topics from Internet —Powered by AI
      </Typography>

     ) : (
        <Typography sx={{ fontSize: isMobile ? "14px" : "18px", fontWeight: 500 , color: '#FFFFFF'}}>
      Fresh & Strategic Content Ideas — Powered by AI
      </Typography>
     )}
    
     { !isMobile && 
     <Typography
        sx={{ fontSize: "14px", fontWeight: 400, color: "#FFFCFB", mt: 0.5 }}
      >
       Stay ahead with AI-curated LinkedIn post ideas tailored to your expertise, audience, and the latest industry trends. Not generic. Not outdated.
      </Typography>}
      
    </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            mb: isMobile ? 0 : 2,
            alignItems : 'center'
          }}
        >

  
   <Tabs
  value={selectedTopic}
  onChange={handleTabChange}
  variant="scrollable"
  scrollButtons="auto"
  TabIndicatorProps={{ style: { display: "none" } }}
  sx={{
    minHeight: { xs: "32px", sm: "34px", md: "36px" },

    "& .MuiTabScrollButton-root": {
      color: "#FFFFFF",
      backgroundColor: "transparent",
      transition: "background-color 0.3s ease",
      borderRadius: "50%",
      "&:hover": {
        backgroundColor: "#B9375D",
      },
      "&.Mui-disabled": {
        opacity: 0.2,
        backgroundColor: "transparent",
      },
    },
  }}
>
  {topics
    .filter((topic) => selectedTopics.includes(topic.name))
    .map((topic) => (
      <Tab
        key={topic.name}
        label={topic.name}
        value={topic.name}
        sx={{
          textTransform: "none",
          borderRadius: "22px",
          px: { xs: 2, sm: 2.5, md: 3 },
          mx: { xs: 0.5, sm: 1 },
          minHeight: { xs: "30px", sm: "32px" },
          height: { xs: "30px", sm: "32px" },
          fontWeight: 500,
          fontSize: { xs: "12px", sm: "13px", md: "14px" },
          color: "#FFFFFF",
          whiteSpace: "nowrap",
          "&.Mui-selected": {
            backgroundColor: "#FFFFFF",
            color: "#000000",
          },
          "&:hover": {
            backgroundColor: "#FFFFFF",
            color: "#000000",
          },
        }}
      />
    ))}

  <Tab
    label="+ Add"
    onClick={() => {
      setSelectedTopic("");
      fetchUserTopics();
      setShowTopicDialog(true);
    }}
    sx={{
      textTransform: "none",
      borderRadius: "22px",
      px: { xs: 2, sm: 2.5, md: 3 },
      minHeight: { xs: "30px", sm: "32px" },
      height: { xs: "30px", sm: "32px" },
      fontWeight: 500,
      fontSize: { xs: "12px", sm: "13px", md: "14px" },
      color: "#333",
      backgroundColor: "#F0F0F0",
      whiteSpace: "nowrap",
      "&:hover": {
        backgroundColor: "#ddd",
      },
    }}
  />
</Tabs>


         
<ToggleButtonGroup
  value={selectedRegion === 'Global' ? '' : selectedRegion}
  exclusive
  size="small"
  sx={{
    backgroundColor: "#f5f5f5",
    height: {
      xs: 32,
      sm: 34,
      md: 36
    }
  }}
>
  <ToggleButton
    value={selectedRegion}
    onClick={handleClick}
    sx={{
      textTransform: "none",
      fontWeight: 500,
      fontSize: {
        xs: "12px",
        sm: "13px",
        md: "14px"
      },
      px: {
        xs: 1,
        sm: 1.5,
        md: 2
      },
      pr: 0,
      display: "flex",
      alignItems: "center",
      "&.Mui-selected": {
        backgroundColor: "#0118D8",
        color: "#fff",
      },
      "&:hover": {
        color: "#000000",
        background: "#FFFFFF",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {selectedRegion}
      <IconButton
        size="small"
        sx={{
          color: "#fff",
          ml: 0.5,
          p: 0,
          "&:hover": { backgroundColor: "transparent" },
        }}
      >
        <ArrowDropDownIcon fontSize="small" />
      </IconButton>
    </Box>
  </ToggleButton>

  <ToggleButton
    value="Global"
    onClick={() => setSelectedRegion("Global")}
    sx={{
      textTransform: "none",
      fontWeight: 500,
      fontSize: {
        xs: "12px",
        sm: "13px",
        md: "14px"
      },
      px: {
        xs: 1.5,
        sm: 2,
        md: 2.5
      },
      "&.Mui-selected": {
        backgroundColor: "#0118D8",
        color: "#fff",
      },
      "&:hover": {
        color: "#000000",
        background: "#FFFFFF",
      },
    }}
  >
    Global
  </ToggleButton>
</ToggleButtonGroup>


<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
  {countryOptions.map((country) => (
    <MenuItem key={country.code} onClick={() => handleCountryChange(country.code)}>
      {country.name}
    </MenuItem>
  ))}
</Menu>

          
        </Box>

    </Box>


<Box
  mt={0}
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: isMobile ? 0.5 : 2,
    justifyContent: isMobile ? "center" : "space-between",
    width: "100%",
    px: isMobile ? 0 : 0,
  }}
>
  {loading
    ? [...Array(9)].map((_, index) => (
        <Card
          key={index}
          sx={{
            width: isMobile ? "100%" : "calc(33.33% - 16px)",
            borderRadius: 0,
            boxShadow: 1,
            overflow: "hidden",
          }}
        >
            <CardContent>
            <Skeleton variant="text" width="20%" height={16} />
            <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="100%" height={20} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="70%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="90%" height={20} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="75%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="30%" height={20} />
          </CardContent>
        </Card>
      ))
    : articles.map((article, index) => (
        <Card
          onClick={() => handleCardClick(article)}
          key={index}
          sx={{
            width: isMobile ? "100%" : "calc(33.33% - 16px)",
            borderRadius: 0,
            boxShadow: 1,
            cursor: "pointer",
            mt: 0.5,
          }}
        >
          <CardContent>
            <Typography variant="caption" color="primary">
              #{selectedTopic}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "14px", fontWeight: 500 }}>
              {article.title}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {renderFormattedSummary(truncate(article.summary))}
            </Box>
          </CardContent>
        </Card>
      ))}
</Box>




      </Box>


  <Box mt={4} sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
    <Button
    onClick={() => fetchArticles(page + 1)}

      sx={{
        padding: "10px 20px",
        backgroundColor: "#222831",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "26px",
        fontWeight: 500,
        cursor: "pointer",
        textAlign : "center",
        textTransform: "none",
         "&:hover": {
                    color: '#FFFFFF',
                    background : '#0118D8'
                  }
      }}
    >
      Load More
    </Button>
  </Box>


  

        <Dialog
          open={showTopicDialog}
          onClose={() => setShowTopicDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Add or Deselect topics
            <IconButton
              onClick={() => setShowTopicDialog(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>
              Your selected topics:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
              {selectedTopics.map((topic) => (
                <Box
                  key={topic}
                  sx={{
                    backgroundColor: "#7A73D1",
                    color: "#fff",
                    px: 2,
                    py: 0.5,
                    borderRadius: "20px",
                  }}
                >
                  {topic}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {[...topics] // copy array to avoid mutating state directly
                .sort((a, b) => a.name.localeCompare(b.name)) // ✅ sort alphabetically
                .map((topic) => {
                  const isSelected = selectedTopics.includes(topic.name);
                  return (
                    <Box
                      key={topic.name}
                      onClick={() => {
                        setSelectedTopics((prev) =>
                          isSelected
                            ? prev.filter((t) => t !== topic.name)
                            : [...prev, topic.name]
                        );
                      }}
                      sx={{
                        backgroundColor: isSelected ? "#7A73D1" : "#f0f0f0",
                        color: isSelected ? "#fff" : "#333",
                        px: 2,
                        py: 0.5,
                        borderRadius: "20px",
                        cursor: "pointer",
                        border: isSelected ? "none" : "1px solid #ccc",
                        "&:hover": {
                          backgroundColor: isSelected ? "#5E56C6" : "#e0e0e0",
                        },
                      }}
                    >
                      {topic.name}
                    </Box>
                  );
                })}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Box
              onClick={saveUserTopics}
              sx={{
                background: "#093FB4",
                borderRadius: "26px",
                px: 3,
                py: 0.7,
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <Typography>Save Topics</Typography>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => {}}
          maxWidth="md"
          fullWidth
          disableEscapeKeyDown
          hideBackdrop={false}
        >
          <DialogTitle sx={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 500 }}>
            {activeArticle?.title}
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{ position: "absolute", right: 2, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
         {activeArticle?.summary && (
  <Box sx={{ mt: 1 }}>
    {renderFormattedSummary(activeArticle.summary)}
  </Box>
)}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Box
              onClick={() => {
                const combinedText = `${activeArticle?.title}\n\n${activeArticle?.summary}`;
                setPostText(combinedText);
                setShowRewriteDialog(true);
              }}
              sx={{
                background: "#093FB4",
                borderRadius: "26px",
                px: 3,
                py: 0.7,
                color: "#FFFFFF",
                cursor: "pointer",
                "&:hover": {
                  background: "#004030",
                  color: "#FFFFFF",
                },
              }}
            >
              <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Generate Post</Typography>
            </Box>

            <Box
              onClick={handleCloseDialog}
              sx={{
                background: "#D7D7D7",
                borderRadius: "26px",
                px: 3,
                py: 0.7,
                cursor: "pointer",
                "&:hover": {
                  background: "#748873",
                  color: "#FFFFFF",
                },
              }}
            >
              <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Back</Typography>
            </Box>
          </DialogActions>
        </Dialog>

        {showRewriteDialog && (
          <GenerateWithAI
            open={showRewriteDialog}
            postText={postText}
            onClose={() => setShowRewriteDialog(false)}
            onRewriteComplete={(rewritten) => {
              setRewrittenText(rewritten);
              setShowRewriteDialog(false);
              setShowComposer(true);
            }}
          />
        )}

        {showComposer && (
          <AiPostComposer
            open={showComposer}
            postText={rewrittenText}
            onClose={(status) => {
              setShowComposer(false);
              setOpenDialog(false);

              if (status === "published") {
                setSnackbar({
                  open: true,
                  message: "Post published successfully!",
                  severity: "success",
                });
              } else if (status === "scheduled") {
                setSnackbar({
                  open: true,
                  message: "Post scheduled successfully!",
                  severity: "info",
                });
              } else if (status === "drafted") {
                setSnackbar({
                  open: true,
                  message: "Post saved as draft.",
                  severity: "warning",
                });
              }
            }}
          />
        )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        ContentProps={{
          sx: {
            backgroundColor:
              snackbar.severity === "success"
                ? "green"
                : snackbar.severity === "info"
                ? "#1976d2"
                : snackbar.severity === "warning"
                ? "#ff9800"
                : "gray",
            color: "#fff",
            fontWeight: 500,
          },
        }}
      />
    </>
  );
}
