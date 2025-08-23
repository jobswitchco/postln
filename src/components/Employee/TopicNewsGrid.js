import { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Button,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GenerateWithAI from "./GenerateWithAI";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AiPostComposer from "./AiPostComposer";
import axios from "axios";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

countries.registerLocale(enLocale);

const countryOptions = [
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CN", name: "China" },
  { code: "EG", name: "Egypt" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russian Federation" },
  { code: "SG", name: "Singapore" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "UA", name: "Ukraine" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

const truncate = (text, limit = 220) =>
  text.length > limit ? text.slice(0, limit) + "..." : text;

export default function TopicNewsGrid() {
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveTopicsLoading, setSaveTopicsLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [postText, setPostText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl="/api/usersOn";
  const [selectedRegion, setSelectedRegion] = useState("Global");
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showAllCards, setShowAllCards] = useState(false);
  const [requestedCount, setRequestedCount] = useState(9);
  const wsRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const limit = 9;

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
     const getRegionLabel = () => {
  if (selectedRegion === "Global") return "Global";
  const found = countryOptions.find(c => c.code.toLowerCase() === String(selectedRegion).toLowerCase());
  return found ? found.code : String(selectedRegion).toUpperCase();
};


  const handleCountryChange = (codeOrGlobal) => {
  setSelectedRegion(codeOrGlobal); // "Global" or "au", "in", ...
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
      if (safeLine.startsWith("### ")) {
        return (
          <Typography key={index} sx={{ fontSize: "14px", fontWeight: 500, mt: 2 }}>
            {safeLine.replace("### ", "")}
          </Typography>
        );
      }
      if (/^- \*\*(.+?)\*\*:/.test(safeLine)) {
        const match = safeLine.match(/^- \*\*(.+?)\*\*: (.+)/);
        if (!match) return null;
        const [_, boldTitle, rest] = match;
        return (
          <Box key={index} sx={{ display: "flex", alignItems: "flex-start", mt: 1 }}>
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
      if (safeLine.startsWith("- ")) {
        const bulletText = safeLine
          .slice(2)
          .replace(/\*\*(.+?)\*\*/g, `<span style='font-weight: 500;'>$1</span>`);
        return (
          <Box key={index} sx={{ display: "flex", alignItems: "flex-start", mt: 1 }}>
            <Typography sx={{ mr: 1 }}>•</Typography>
            <Typography
              sx={{ fontSize: "14px", fontWeight: 400, whiteSpace: "pre-line" }}
              dangerouslySetInnerHTML={{ __html: bulletText }}
            />
          </Box>
        );
      }
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
      if (currentY < lastScrollY && !showAllCards) {
        setShowAllCards(true);
      }
      lastScrollY = currentY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, showAllCards]);



  const handleTabChange = (event, newValue) => setSelectedTopic(newValue);
 
const handleCardClick = async (article) => {
  setActiveArticle(article);
  setOpenDialog(true);
  setLoadingArticle(true);

  try {
    const res = await axios.get(`${baseUrl}/articles/clean/${article._id}`);
    setActiveArticle(prev => ({
      ...prev,
      summary: res.data.cleanedSummary || prev.summary,
    }));
  } catch (err) {
    console.error("Error fetching cleaned article:", err);
  } finally {
    setLoadingArticle(false);
  }
};




  const handleCloseDialog = () => {
    setOpenDialog(false);
    setActiveArticle(null);
  };

  const fetchUserTopics = async () => {
    try {
      const response = await axios.get(baseUrl + "/get-topics-of-user", {
        withCredentials: true,
      });
      const fetchedTopics = response.data.result || [];
      setTopics(fetchedTopics);
      const preselected = fetchedTopics.filter((t) => t.selected).map((t) => t.name);
      setSelectedTopics(preselected);
      const firstSelected = fetchedTopics.find((t) => t.selected);
      if (firstSelected) setSelectedTopic(firstSelected.name);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

const setupWebSocket = (topic, region, page = 1, limit = 9) => {
  if (wsRef.current) {
    try { wsRef.current.close(); } catch {}
    wsRef.current = null;
  }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

  // Build WS URL dynamically
  // If your server exposes WS on same origin:
  const wsUrl = `${protocol}://${window.location.host}/api/usersOn`; // matches your express route + WS server

const ws = new WebSocket(wsUrl);
wsRef.current = ws;


  // ✅ Only reset requestedCount for first page
  if (page === 1) {
    setArticles([]);
    setRequestedCount(limit);
  }

  ws.onopen = () => {
    setIsStreaming(true);
    if (page === 1) {
      setLoading(true);
      setLoadingMore(false);
    } else {
      setLoadingMore(true);
    }
    ws.send(JSON.stringify({ type: "subscribe", topic, region, page, limit }));
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "new-article" && message.article) {
        setArticles((prev) => {
          if (prev.find((a) => a.title === message.article.title)) return prev;
          return [...prev, message.article];
        });
      } else if (message.type === "stream-end") {
        setIsStreaming(false);
        setLoading(false);
        setLoadingMore(false);
        if (typeof message.hasMore === "boolean") setHasMore(message.hasMore);
      }
    } catch (err) {
      console.error("WS parse error", err);
    }
  };

  ws.onclose = () => {
    setIsStreaming(false);
    setLoading(false);
    setLoadingMore(false);
  };
};

  const loadArticles = (pageToLoad = 1) => {
    if (!selectedTopic || !selectedRegion) return;
    if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setupWebSocket(selectedTopic, selectedRegion, pageToLoad, 9);
    const fallback = setTimeout(() => {
      setLoading(false);
      setLoadingMore(false);
      setIsStreaming(false);
    }, 15000);
    return () => clearTimeout(fallback);
  };

  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setIsStreaming(true);
    loadArticles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, selectedRegion]);

  useEffect(() => {
    const detectRegionAndLoad = async () => {
      try {
        const res = await axios.get(baseUrl + "/get-location-from-ip");
        const { country_name, country_code } = res.data;
        setSelectedRegion(country_code || "IN");
      } catch (err) {
        console.error("Error detecting location:", err);
      }
    };
    fetchUserTopics();
    // detectRegionAndLoad();
  }, []);

    useEffect(() => {
      if (selectedTopic && selectedRegion) {
        setArticles([]);
        setPage(1);
      }
    }, [selectedTopic, selectedRegion]);
  
   const saveUserTopics = async () => {
      try {
        setSaveTopicsLoading(true);
        const response = await axios.post(
          baseUrl + "/update-topics-of-user",
          { selectedTopics },
          { withCredentials: true }
        );
  
        if (response.data.updated) {
          setSaveTopicsLoading(false);
          toast.success('Topics Updated');
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
      <Box sx={{ mt: 4 }}>
        {/* Header / Tabs / Region Selector omitted for brevity — same as before */}
     <Box
          sx={{
            position: "sticky",
            top: 0,
            backgroundColor: "#222831",
            py: 2,
            boxShadow: "0px 4px 8px -2px rgba(0,0,0,0.08)",
            px: 2,
            width: "100%",
            borderTopLeftRadius: "22px",
            borderTopRightRadius: "22px",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
            {isMobile ? (
              <Typography sx={{ fontSize: isMobile ? "14px" : "18px", fontWeight: 500, color: "#FFFFFF" }}>
                Live & Trending Topics from Internet —Powered by AI
              </Typography>
            ) : (
              <Typography sx={{ fontSize: isMobile ? "14px" : "18px", fontWeight: 500, color: "#FFFFFF" }}>
                Fresh & Strategic Content Ideas — Powered by AI
              </Typography>
            )}

            {!isMobile && (
              <Typography sx={{ fontSize: "14px", fontWeight: 400, color: "#FFFCFB", mt: 0.5 }}>
                Stay ahead with AI-curated LinkedIn post ideas tailored to your expertise, audience, and the latest industry trends.
                Not generic. Not outdated.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              mb: isMobile ? 0 : 2,
              alignItems: "center",
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

         <Button
  onClick={handleClick}
  size="small"
    sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: {
                    xs: "12px",
                    sm: "13px",
                    md: "14px",
                  },
                  border: '1px solid blue',
                  background: '#0118D8',
                  color: '#FFF',
                  px: {
                    xs: 4,
                    sm: 4,
                    md: 3,
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


  endIcon={<ArrowDropDownIcon />}
>
  {getRegionLabel()}
</Button>

<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
  {/* Title */}
  <MenuItem disabled sx={{ opacity: 1, pointerEvents: "none" }}>
    <Typography sx={{ fontWeight: 600 }}>Select Country</Typography>
  </MenuItem>

  {/* Global option */}
  <MenuItem
    selected={selectedRegion === "Global"}
    onClick={() => handleCountryChange("Global")}
  >
    Global
  </MenuItem>

  <Box sx={{ mx: 1, my: 0.5, height: 1, backgroundColor: "divider" }} />

  {/* Your whitelisted countries */}
  {countryOptions.map((country) => (
    <MenuItem
      key={country.code}
      selected={
        String(selectedRegion).toLowerCase() === String(country.code).toLowerCase()
      }
      onClick={() => handleCountryChange(country.code)}
    >
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
            px: 0,
          }}
        >
          {/* Render articles */}
        {articles.map((article, index) => (
  <Card
    onClick={() => handleCardClick(article)}
    key={"article-" + index}
   sx={{
  width: isMobile ? "100%" : "calc(33.33% - 16px)",
  borderRadius: 0,
  borderTopLeftRadius: 8,   // top-left curve
  borderTopRightRadius: 8,  // top-right curve
  boxShadow: 1,
  cursor: "pointer",
  mt: 0.5,
}}

  >
    {/* Image at the top */}
    {article.image && (
      <CardMedia
        component="img"
        height="140"
        image={article.image}
        alt={article.title}
        sx={{
          objectFit: "cover",
        }}
      />
    )}

    <CardContent>
      {/* <Typography variant="caption" color="primary">
        #{selectedTopic}
      </Typography> */}
      <Typography sx={{ mt: 0.5, fontSize: "14px", fontWeight: 500, fontFamily : 'Inter' }}>
        {article.title}
      </Typography>
      <Box sx={{ mt: 1 }}>
        {renderFormattedSummary(truncate(article.summary))}
      </Box>
    </CardContent>
  </Card>
))}


          {/* Skeleton placeholders remain until all 9 slots are filled */}
         {(isStreaming || articles.length < requestedCount) &&
  Array.from({ length: Math.max(requestedCount - articles.length, 0) })
    .map((_, index) => (
      <Card key={"skeleton-" + index}    
      sx={{
        width: isMobile ? "100%" : "calc(33.33% - 16px)",
        borderRadius: 0,
        boxShadow: 1,
        overflow: "hidden",
        mt: 0.5,
      }}>
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
            ))}
        </Box>

        <Box mt={4} sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Button
  disabled={loadingMore || loading || !hasMore}
  onClick={() => {
    const next = page + 1;
    setPage(next);
    setRequestedCount((prev) => prev + limit);
    loadArticles(next);
  }}
   sx={{
              padding: "10px 20px",
              backgroundColor: "#222831",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "26px",
              fontWeight: 500,
              textAlign: "center",
              textTransform: "none",
              "&:hover": {
                color: '#FFFFFF',
                background: '#0118D8'
              }
            }}
>
  {loadingMore ? "Loading..." : hasMore ? "Load More" : "No More Articles"}
</Button>
        </Box>
      </Box>
   <Dialog
                open={showTopicDialog}
                onClose={() => setShowTopicDialog(false)}
                maxWidth="md"
                fullWidth
              >

            {saveTopicsLoading ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            mt: 1,
                            my: 4
                          }}
                        >
                          <CircularProgress
                            size={24}
                            sx={{
                              mb: 1, // space between loader & text
                            }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            Updating Topics...
                          </Typography>
                        </Box>
                      ) : (

                            <>
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
                            </>
                          )
                        }
              


              </Dialog>
      
              {/* Dialog */}

<Dialog
  open={openDialog}
  onClose={() => {}}
  maxWidth="md"
  fullWidth
  fullScreen={isMobile} // 👈 full screen on mobile
  disableEscapeKeyDown
  hideBackdrop={false}
>
  <DialogTitle sx={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 500 }}>
    {activeArticle?.title || <Skeleton width="60%" />}
    <IconButton
      aria-label="close"
      onClick={handleCloseDialog}
      sx={{ position: "absolute", right: 2, top: 8 }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent dividers>
    {loadingArticle ? (
      <Box sx={{ mt: 1 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="text" width={`${80 + (i % 3) * 10}%`} height={20} />
        ))}
        <Box sx={{ mt: 3 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="text" width={`${80 + (i % 3) * 10}%`} height={20} />
          ))}
        </Box>
      </Box>
    ) : (
      activeArticle?.summary && (
        <Box sx={{ mt: 1 }}>{renderFormattedSummary(activeArticle.summary)}</Box>
      )
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
        "&:hover": { background: "#004030", color: "#FFFFFF" },
      }}
    >
      <Typography sx={{ fontSize: isMobile ? "14px" : "16px" }}>
        Generate Post
      </Typography>
    </Box>

    <Box
      onClick={handleCloseDialog}
      sx={{
        background: "#D7D7D7",
        borderRadius: "26px",
        px: 3,
        py: 0.7,
        cursor: "pointer",
        "&:hover": { background: "#748873", color: "#FFFFFF" },
      }}
    >
      <Typography sx={{ fontSize: isMobile ? "14px" : "16px" }}>
        Back
      </Typography>
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
