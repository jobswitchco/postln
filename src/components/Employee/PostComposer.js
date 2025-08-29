import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
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
  Grid,
  Chip,
  ToggleButtonGroup,
  ToggleButton
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
import FullScreenLoader from './FullScreenLoader';

// NEW (formatting toolbar icons)
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";

// NEW (preview action bar icons)
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

// NEW (preview mode icons)
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

/** ===================== Unicode helpers (bold / italicSans + underline/strike) ===================== */
const ranges = {
  bold: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  italicSans: { upper: 0x1d608, lower: 0x1d622 },
};
const COMB_UNDER = "\u0332";
const COMB_STRIKE_A = "\u0336"; // default
const COMB_STRIKE_B = "\u0335"; // alternate

const isAsciiLetter = (cp) => (cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122);
const isAsciiDigit = (cp) => cp >= 48 && cp <= 57;
const isAsciiAlnum = (cp) => isAsciiLetter(cp) || isAsciiDigit(cp);

const mapChar = (ch, set) => {
  const code = ch.codePointAt(0);
  if (isAsciiLetter(code)) {
    const base = code <= 90 ? 65 : 97;
    const delta = code - base;
    const start = code <= 90 ? ranges[set].upper : ranges[set].lower;
    return String.fromCodePoint(start + delta);
  }
  if (isAsciiDigit(code) && ranges[set].digit) {
    return String.fromCodePoint(ranges[set].digit + (code - 48));
  }
  return ch;
};
const transformBySet = (text, set) => {
  let out = "";
  for (const ch of text) out += mapChar(ch, set);
  return out;
};

// reverse maps (styled -> plain)
const makeReverseMap = (set) => {
  const m = Object.create(null);
  for (let i = 0; i < 26; i++) {
    m[String.fromCodePoint(ranges[set].upper + i)] = String.fromCodePoint(65 + i);
    m[String.fromCodePoint(ranges[set].lower + i)] = String.fromCodePoint(97 + i);
  }
  if (ranges[set].digit) {
    for (let i = 0; i < 10; i++) {
      m[String.fromCodePoint(ranges[set].digit + i)] = String.fromCodePoint(48 + i);
    }
  }
  return m;
};

const removeCombining = (text, mark) => text.replaceAll(mark, "");
const applyCombining = (text, mark) =>
  text.split("").map((c) => (c === "\n" ? "\n" : c + mark)).join("");

// ===================== Misc constants =====================
const CHARACTER_LIMIT = 2800;

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

const pillStyles = {
  fontSize: 12,
  height: 22,
  borderRadius: '999px',
  px: 1,
  bgcolor: '#EEF3F8'
};

const overlapAvatar = (index) => ({
  zIndex: 5 - index,
  ml: index === 0 ? 0 : -0.8,
  border: '2px solid #fff',
  width: 22,
  height: 22,
  fontSize: 12
});

const PostComposer = () => {
  const [open, setOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingTranscribe, setLoadingTranscribe] = useState(false);

  // MAIN editor text (this is what we format)
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

  // selection ref shared with main editor
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
    const [previewWidth, setPreviewWidth] = useState(0);
      const roRef = useRef(null);
    
  

  const [publishSuccessSnackbar, setPublishSuccessSnackbar] = useState({
    open: false,
    message: "",
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl = "/api/usersOn";

  const [rewrites, setRewrites] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const reactions = [
  { icon: "👍", bg: "#0a66c2" },   // LinkedIn blue for Like
  { icon: "❤️", bg: "#DCDCDC" }    // Red for Love
];

  


  // ===== Formatting specific state =====
  const [strikeStyle, setStrikeStyle] = useState("0336"); // alt: "0335"
  const reverseMaps = useMemo(
    () => ({
      bold: makeReverseMap("bold"),
      italicSans: makeReverseMap("italicSans"),
    }),
    []
  );
  const toPlain = (s) => {
    const all = [reverseMaps.bold, reverseMaps.italicSans];
    let out = "";
    for (const ch of s) {
      let repl = ch;
      for (const map of all) {
        if (map[ch]) {
          repl = map[ch];
          break;
        }
      }
      out += repl;
    }
    return out;
  };
  const isAllStyled = (s, setKey) => {
    const map = reverseMaps[setKey];
    let seen = 0;
    let styled = 0;
    for (const ch of s) {
      if (ch === "\n") continue;
      const cp = ch.codePointAt(0);
      const stylableAscii = isAsciiAlnum(cp);
      const alreadyStyled = !!map[ch];
      if (stylableAscii || alreadyStyled) {
        seen++;
        if (alreadyStyled) styled++;
      }
    }
    return seen > 0 && styled === seen;
  };

  // Selection memory for main editor
  const selRef = useRef({ start: 0, end: 0 });
  const captureSelection = () => {
    const el = inputRef.current;
    if (!el) return;
    selRef.current = {
      start: el.selectionStart ?? selRef.current.start ?? 0,
      end: el.selectionEnd ?? selRef.current.end ?? 0,
    };
  };
  const getSelection = () => {
    const el = inputRef.current;
    if (!el) return null;
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (start == null || end == null || start === end) {
      start = selRef.current.start ?? 0;
      end = selRef.current.end ?? 0;
    }
    if (start === end) return null;
    return { el, start, end };
  };
  const replaceSelection = (newChunk) => {
    const sel = getSelection();
    if (!sel) return;
    const before = postText.slice(0, sel.start);
    const after = postText.slice(sel.end);
    const next = before + newChunk + after;
    const caretPos = before.length + newChunk.length;
    setPostText(next);
    setEditedText(next);
    requestAnimationFrame(() => {
      sel.el.focus();
      sel.el.setSelectionRange(caretPos, caretPos);
      selRef.current = { start: caretPos, end: caretPos };
      setCursorPos(caretPos);
    });
    commit(next, caretPos, caretPos);
  };
  const insertAtSelection = (insertText) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? selRef.current.start ?? 0;
    const end = el?.selectionEnd ?? selRef.current.end ?? start;
    const before = postText.slice(0, start);
    const after = postText.slice(end);
    const next = before + insertText + after;
    const caretPos = before.length + insertText.length;
    setPostText(next);
    setEditedText(next);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(caretPos, caretPos);
      }
      selRef.current = { start: caretPos, end: caretPos };
      setCursorPos(caretPos);
    });
    commit(next, caretPos, caretPos);
  };

  // Undo/Redo history for main editor
  const [history, setHistory] = useState([{ text: "", start: 0, end: 0 }]);
  const [histIndex, setHistIndex] = useState(0);
  const MAX_HISTORY = 200;

  const commit = (nextText, start, end) => {
    setHistory((prev) => {
      const base = prev.slice(0, histIndex + 1);
      const last = base[base.length - 1];
      if (last && last.text === nextText && last.start === start && last.end === end) {
        return base;
      }
      const appended = [...base, { text: nextText, start, end }];
      if (appended.length > MAX_HISTORY) appended.shift();
      setHistIndex(appended.length - 1);
      return appended;
    });
  };
  const restoreState = (state) => {
    setPostText(state.text);
    setEditedText(state.text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(state.start, state.end);
      selRef.current = { start: state.start, end: state.end };
      setCursorPos(state.end);
    });
  };
  const undo = () => {
    if (histIndex <= 0) return;
    const idx = histIndex - 1;
    setHistIndex(idx);
    restoreState(history[idx]);
  };
  const redo = () => {
    if (histIndex >= history.length - 1) return;
    const idx = histIndex + 1;
    setHistIndex(idx);
    restoreState(history[idx]);
  };

  // Toggle actions
  const toggleStyle = (setKey) => {
    const sel = getSelection();
    if (!sel) return;
    const chunk = postText.slice(sel.start, sel.end);
    if (isAllStyled(chunk, setKey)) {
      const plain = Array.from(chunk).map((c) => reverseMaps[setKey][c] || c).join("");
      replaceSelection(plain);
    } else {
      const plain = toPlain(chunk);
      const styled = transformBySet(plain, setKey);
      replaceSelection(styled);
    }
  };
  const toggleUnderline = () => {
    const sel = getSelection();
    if (!sel) return;
    const chunk = postText.slice(sel.start, sel.end);
    const next = chunk.includes(COMB_UNDER)
      ? removeCombining(chunk, COMB_UNDER)
      : applyCombining(chunk, COMB_UNDER);
    replaceSelection(next);
  };
  const toggleStrike = () => {
    const mark = strikeStyle === "0335" ? COMB_STRIKE_B : COMB_STRIKE_A;
    const sel = getSelection();
    if (!sel) return;
    const chunk = postText.slice(sel.start, sel.end);
    const next = chunk.includes(mark)
      ? removeCombining(chunk, mark)
      : applyCombining(chunk, mark);
    replaceSelection(next);
  };

  // Hashtags renderer + decorated preview
  const renderHashtags = (text) => {
    const parts = text.split(/(#[\w]+)/g);
    return parts.map((part, i) =>
      /^#[\w]+$/.test(part)
        ? <span key={i} style={{ fontWeight: 500, color: "#0a66c2" }}>{part}</span>
        : part
    );
  };
  const renderWithTextDecor = (raw) => {
    if (!raw) return "Your formatted post will preview here…";
    const STRIKE = strikeStyle === "0335" ? COMB_STRIKE_B : COMB_STRIKE_A;
    const nodes = [];
    let i = 0, buf = "", decoBuf = "", deco = { u: false, s: false };
    const flushBuf = () => { if (buf) { nodes.push(<span key={`t-${nodes.length}`}>{buf}</span>); buf = ""; } };
    const flushDeco = () => {
      if (decoBuf) {
        const style = {
          textDecoration: `${deco.u ? "underline" : ""} ${deco.s ? "line-through" : ""}`.trim(),
        };
        nodes.push(<span key={`d-${nodes.length}`} style={style}>{decoBuf}</span>);
        decoBuf = ""; deco = { u: false, s: false };
      }
    };
    while (i < raw.length) {
      const ch = raw[i];
      const next = raw[i + 1];
      const next2 = raw[i + 2];
      const isUnderPair = next === COMB_UNDER;
      const isStrikePair = next === STRIKE;
      if ((isUnderPair || isStrikePair) && ch !== "\n") {
        flushBuf();
        let u = isUnderPair, s = isStrikePair;
        if (next2 === COMB_UNDER && !u) { u = true; i += 1; }
        if (next2 === STRIKE && !s) { s = true; i += 1; }
        const same = deco.u === u && deco.s === s;
        if (!same) { flushDeco(); deco = { u, s }; }
        decoBuf += ch;
        i += u && s ? 3 : 2;
        continue;
      }
      if (decoBuf) flushDeco();
      buf += ch;
      i += 1;
    }
    flushDeco(); flushBuf();

    const withBreaks = [];
    nodes.forEach((n) => {
      const text = n.props.children;
      const style = n.props.style;
      const parts = String(text).split("\n");
      parts.forEach((p, j) => {
        if (p)
          withBreaks.push(
            <span key={`${n.key}-${j}`} style={style}>
              {renderHashtags(p)}
            </span>
          );
        if (j < parts.length - 1) withBreaks.push(<br key={`${n.key}-br-${j}`} />);
      });
    });
    return withBreaks;
  };

  const isCharLimitExceeded =
    postText.length > CHARACTER_LIMIT || originalPostText.length > CHARACTER_LIMIT;
  const wordCount = postText.trim().split(/\s+/).filter(Boolean).length;

  // ====== Existing helpers & effects remain the same ======
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

  const handleCopy = async (textToCopy) => {
    const t = typeof textToCopy === "string" ? textToCopy : postText;
    try {
      await navigator.clipboard.writeText(t);
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
    const checkMicPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        if (result.state === 'denied') {
          alert("Microphone access is blocked. Please allow it in your browser settings (click the lock icon near the address bar).");
          return false;
        }
        return true;
      } catch {
        return true;
      }
    };
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
          setEditedText(prev => `${prev}\n${res.data.transcribedText}`);
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
          recognition.start();
        } else {
          setIsListening(false);
          isManuallyStopped.current = false;
        }
      };

      recognitionRef.current = recognition;
    }

    if (isListening) {
      isManuallyStopped.current = true;
      recognitionRef.current.stop();
    } else {
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
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(baseUrl + "/publish-text-post", { postText: textContent}, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
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
      setPublishSuccessSnackbar({ open: true, message: "Post is published" });
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
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(
          `${baseUrl}/schedule-text-post`,
          { postText : textContent, scheduledAt, postType: "text" },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
      }

      if (res?.data?.scheduled) {
        setPublishSuccessSnackbar({ open: true, message: "Post is scheduled" });
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
        setPublishSuccessSnackbar({ open: true, message: "Draft is saved" });
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

  const handleMainDialogOpen = () => setOpen(true);
  const handleMainClose = () => {
    setPostText("");
    setOpen(false);
  };

  const getAvailableTimeSlots = (selectedDate) => {
    const now = dayjs();
    const selected = dayjs(selectedDate).startOf('day');
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
    setOriginalPostText("");
    setConfirmOpen(false);
    setComposerOpen(false);
    setVersionsOpen(true);
  };

  const prevCard = () => setCurrentIdx((p) => (p - 1 + rewrites.length) % rewrites.length);
  const nextCard = () => setCurrentIdx((p) => (p + 1) % rewrites.length);

  const openComposer = (text) => {
    const t = text ?? "";
    setComposerText(t);
    setComposerOpen(true);
    setEditedText(t);
    setVersionsOpen(false);
    setShowEmojiPicker(false);
  };

  // ===== Preview refs =====
  const previewBodyRef = useRef(null);

  // ======== NEW: Preview Mode (mobile / desktop) ========
  const [previewMode, setPreviewMode] = useState("desktop");
  useEffect(() => {
    setPreviewMode(isMobile ? "mobile" : "desktop");
  }, [isMobile]);

      useLayoutEffect(() => {
      const container = previewBodyRef.current?.parentElement;
      if (!container) return;
  
      let rafId = 0;
      let last = -1;
  
      roRef.current = new ResizeObserver(([entry]) => {
        const w = Math.round(
          entry.contentBoxSize?.[0]?.inlineSize ??
            entry.contentRect?.width ??
            container.clientWidth
        );
        if (w === last) return;
        last = w;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setPreviewWidth(w);
        });
      });
  
      roRef.current.observe(container);
  
      return () => {
        cancelAnimationFrame(rafId);
        roRef.current?.disconnect();
        roRef.current = null;
      };
    }, [previewMode]);


  const MAX_VISIBLE_LINES_DESKTOP = 3;
  const MAX_VISIBLE_LINES_MOBILE = 2;
  const ELLIPSIS_TEXT = " …more";

  const getTruncationIndexDOM = (raw, { el, maxLines }) => {
    if (!raw || !el) return -1;

    const cs = getComputedStyle(el);

    const measurer = document.createElement("div");
    measurer.style.position = "fixed";
    measurer.style.left = "-99999px";
    measurer.style.top = "-99999px";
    measurer.style.visibility = "hidden";
    measurer.style.width = `${el.clientWidth}px`;
    measurer.style.whiteSpace = "pre-wrap";
    measurer.style.wordBreak = cs.wordBreak || "break-word";
    measurer.style.font = cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    measurer.style.letterSpacing = cs.letterSpacing;
    measurer.style.lineHeight = cs.lineHeight;
    document.body.appendChild(measurer);

    const sample = new Array(maxLines).fill("A").join("\n");
    measurer.textContent = sample;
    const maxHeight = measurer.getBoundingClientRect().height + 0.75;

    let lo = 0, hi = raw.length, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const prefix = raw.slice(0, mid);
      measurer.textContent = prefix + (mid < raw.length ? ELLIPSIS_TEXT : "");
      const h = measurer.getBoundingClientRect().height;

      if (h <= maxHeight) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    document.body.removeChild(measurer);

    if (ans >= raw.length) return -1;

    while (ans > 0 && /\s/.test(raw[ans - 1])) ans--;

    return Math.max(0, ans);
  };

  const renderWithMore = (raw) => {
    if (!raw) return "Your formatted post will preview here…";
    const maxLines = previewMode === "mobile" ? MAX_VISIBLE_LINES_MOBILE : MAX_VISIBLE_LINES_DESKTOP;
    const el = previewBodyRef.current;
    const cut = getTruncationIndexDOM(raw, { el, maxLines });

    if (cut < 0) return renderWithTextDecor(raw);

    const before = raw.slice(0, cut);
    const after = raw.slice(cut);
    const needsSpaceAfter = after && !/^\s/.test(after);

    return (
      <>
        {renderWithTextDecor(before)}
        <span style={{ color: "#6b7280" }}>{ELLIPSIS_TEXT.trimStart()}</span>
        {needsSpaceAfter ? " " : null}
        {renderWithTextDecor(after)}
      </>
    );
  };

  // ========= reactions + counts for preview (demo placeholders) =========
  const [reactionCounts, setReactionCounts] = useState({
    likes: 56,
    comments: 235,
    reposts: 12
  });
  const [userReacted, setUserReacted] = useState(false);

  const toggleLike = () => {
    setUserReacted((prev) => {
      const next = !prev;
      setReactionCounts((rc) => ({
        ...rc,
        likes: Math.max(0, rc.likes + (next ? 1 : -1))
      }));
      return next;
    });
  };

  return (
    <>
      {/* Launch Box */}
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
          "&:hover": { transform: "scale(1.02)", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" },
        }}
      >
        <Stack direction="row" gap={1} alignItems="center">
          <LinkedInIcon sx={{fontSize : '36px'}}/>
          <Typography sx={{ fontSize: "16px", fontWeight: 500 }}>
            Create a new post
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: "14px", color: "#3E3F5B" }}>
          Turn your drafts/ideas into powerful LinkedIn posts with PostLn.
          Write in your own voice—guided by viral formats and real-time industry trends.
        </Typography>
      </Box>

      {/* Publishing overlay */}
      {publishing ? (
        <Box sx={{ position:'absolute', inset:0, backgroundColor:'rgba(255,255,255,0.8)', zIndex:1000,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <Box sx={{ width:'60%', mb:2 }}>
            <Box sx={{ height:8, backgroundColor:'#ccc', borderRadius:10 }}>
              <Box sx={{ height:'100%', width:'100%', backgroundColor:'#093FB4', borderRadius:10, animation:'loading 2s infinite' }} />
            </Box>
          </Box>
          <Typography sx={{ fontWeight:500 }}>Publishing...</Typography>
        </Box>
      ) : (
        /* ===== MAIN DIALOG (FullWidth) with Editor Left + Preview Right ===== */
        <Dialog
          open={open}
          onClose={handleMainClose}
          fullWidth
          maxWidth={false}
          fullScreen
          transitionDuration={0}
          keepMounted
          disableEscapeKeyDown
          hideBackdrop={false}
          PaperProps={{
            sx: { width: "100vw", maxWidth: "100vw", m: 0 }
          }}
        >
          <DialogTitle sx={{ pr:6 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" gap={2}>
                <Avatar src={profilePicture} />
                <Stack>
                  <Typography sx={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 500 }}>{userName}</Typography>
                  <Stack direction="row" gap={1} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setSettingsOpen(true)}>
                    <Typography sx={{ fontSize: isMobile ? '12px' : '14px', color:'grey' }}>
                      Post to {postVisibility === "anyone" ? "Anyone" : "Connections only"}
                    </Typography>
                    <ArrowDropDownOutlinedIcon />
                  </Stack>
                </Stack>
              </Stack>
              <IconButton onClick={handleMainClose} sx={{ ml: 1 }}>
                <CloseIcon/>
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            {/* Two-pane layout */}
            <Grid container spacing={2}>
              {/* LEFT: Editor with formatting toolbar */}
              <Grid item xs={12} md={6}>
                <Card sx={{height: '100%', mt: 1 }}>
                  <CardContent>
                    {/* Formatting toolbar */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Tooltip title="Bold (Ctrl/Cmd + B)">
                        <span>
                          <IconButton
                            onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); captureSelection();}}
                            onClick={()=> toggleStyle("bold")}
                          >
                            <FormatBoldIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Italic Sans (Ctrl/Cmd + I)">
                        <span>
                          <IconButton
                            onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); captureSelection();}}
                            onClick={()=> toggleStyle("italicSans")}
                          >
                            <FormatItalicIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Underline (Ctrl/Cmd + U)">
                        <span>
                          <IconButton
                            onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); captureSelection();}}
                            onClick={toggleUnderline}
                          >
                            <FormatUnderlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Strikethrough">
                        <span>
                          <IconButton
                            onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); captureSelection();}}
                            onClick={toggleStrike}
                          >
                            <StrikethroughSIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Emoji (inserts at selection) */}
                      <Tooltip title="Insert emoji">
                        <span>
                          <IconButton
                            onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); captureSelection();}}
                            onClick={()=> setShowEmojiPicker((v)=>!v)}
                          >
                            <InsertEmoticonIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Box sx={{ flexGrow: 1 }} />

                      {/* Copy */}
                      {/* <Tooltip title="Copy formatted text">
                        <span>
                          <Button
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); captureSelection();}}
                            onClick={()=> handleCopy(postText)}
                            sx={{ fontSize: "10px", fontWeight: 600, color: "grey" }}
                          >
                            Copy
                          </Button>
                        </span>
                      </Tooltip> */}
                    </Stack>

                    {/* Emoji picker popover */}
                    {showEmojiPicker && (
                      <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
                        <Box sx={{ position:'absolute', zIndex:10, top: 120, right: 24, maxWidth:'100%' }}>
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji) => {
                              const ch = emoji?.native ?? "";
                              if (!ch) return;
                              insertAtSelection(ch);
                              setShowEmojiPicker(false);
                            }}
                            theme="light"
                          />
                        </Box>
                      </ClickAwayListener>
                    )}

                    {/* Editor */}
                    <TextField
                      inputRef={inputRef}
                      placeholder="Share your thoughts..."
                      multiline
                      minRows={10}
                      fullWidth
                      value={postText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostText(val);
                        setEditedText(val);
                        requestAnimationFrame(() => {
                          const el = inputRef.current;
                          if (!el) return;
                          const start = el.selectionStart ?? val.length;
                          const end = el.selectionEnd ?? val.length;
                          commit(val, start, end);
                          selRef.current = { start, end };
                          setCursorPos(end);
                        });
                      }}
                      onMouseDown={captureSelection}
                      onSelect={captureSelection}
                      onKeyUp={captureSelection}
                      onClick={captureSelection}
                      onKeyDown={(e) => {
                        const isMod = e.ctrlKey || e.metaKey;
                        if (!isMod) return;
                        const key = e.key.toLowerCase();
                        if (key === "b") { e.preventDefault(); captureSelection(); toggleStyle("bold"); }
                        else if (key === "i") { e.preventDefault(); captureSelection(); toggleStyle("italicSans"); }
                        else if (key === "u") { e.preventDefault(); captureSelection(); toggleUnderline(); }
                        else if (key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
                        else if (key === "y") { e.preventDefault(); redo(); }
                      }}
                      InputProps={{ sx: { fontSize: 16, color: isCharLimitExceeded ? "error.main" : "inherit" } }}
                      variant="outlined"
                    />

                    {/* Image preview below editor */}
                    {selectedImage && (
                      <Box sx={{ position: 'relative', mt: 2 }}>
                        <IconButton
                          onClick={() => setSelectedImage(null)}
                          sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1, background: '#fff' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                        <img
                          src={selectedImage}
                          alt="preview"
                          style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 250 }}
                        />
                      </Box>
                    )}

                    {/* Bottom icons (kept from your original) */}
                    <Box
                      sx={{
                        position: "sticky",
                        bottom: 0,
                        width: "100%",
                        backgroundColor: "#fff",
                        borderTop: "1px solid #e0e0e0",
                        zIndex: 5,
                        py: 1,
                        mt: 2
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton onClick={()=> handleCopy(postText)}>
                            <ContentCopyIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
                          </IconButton>
                          <Snackbar
                            open={snackbarOpen}
                            autoHideDuration={2000}
                            onClose={() => setSnackbarOpen(false)}
                            message="Copied!"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                          />

                          {/* <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
                            <InsertEmoticonIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
                          </IconButton> */}

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
                                  sx={{ fontSize: isMobile ? '20px' : '22px', color: isListening ? 'red' : 'inherit' }}
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

                        {postText.length !== 0 && (
                          <Typography
                            sx={{ fontSize : isMobile ? '12px' : '14px', fontWeight: 400 }}
                            variant="body2"
                            color={isCharLimitExceeded ? 'error' : 'text.secondary'}
                          >
                            {postText.length} / {CHARACTER_LIMIT} characters
                          </Typography>
                        )}
                      </Box>

                      {/* Actions row (kept) */}
                      <Stack direction="row" spacing={2} justifyContent={ isMobile ? "space-between" : "flex-end" } mt={1}>
                        <Stack sx={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
                          {originalPostText && postText !== originalPostText && (
                            <IconButton
                              onClick={() => { setPostText(originalPostText); setOriginalPostText(""); }}
                              sx={{ border:'1px solid #E0E0E0', borderRadius:'8px', px:1, py:0.5, mr:1 }}
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
                                  '&:hover': { border: wordCount > 20 ? '1px solid #093FB4' : '' },
                                }}
                                onClick={() => {
                                  if (wordCount > 20) {
                                    if (isListening && recognitionRef.current) {
                                      isManuallyStopped.current = true;
                                      recognitionRef.current.stop();
                                      setIsListening(false);
                                    }
                                    if (isModelReady) setIsRewriteOpen(true);
                                    else setIsTrainDialogOpen(true);
                                  }
                                }}
                              >
                                <AutoAwesomeOutlinedIcon sx={{ fontSize : isMobile ? '16px' : '22px'}}/>
                                <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Rewrite with AI</Typography>
                              </Box>
                            </CustomTooltip>
                          )}
                        </Stack>

                        <Stack direction="row" gap={1}>
                          <CustomTooltip placement="left" title={isCharLimitExceeded ? "Exceeded characters" : "Schedule for later"}>
                            <Box
                              onClick={() => { if (!isCharLimitExceeded && postText.trim() !== '') setScheduleOpen(true); }}
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
                                '&:hover': { background: postText.trim() === '' || isCharLimitExceeded ? '#C4C4C4' : '#004030' },
                              }}
                            >
                              <CalendarMonthIcon />
                            </Box>
                          </CustomTooltip>

                          <CustomTooltip placement="left" title={isCharLimitExceeded ? "Exceeded characters" : ""}>
                            <Box
                              onClick={() => { if (!isCharLimitExceeded && postText.trim() !== '') handlePublish(postText); }}
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
                                '&:hover': { background: postText.trim() === '' || isCharLimitExceeded ? '#C4C4C4' : '#004030' },
                              }}
                            >
                              <Typography sx={{ fontSize : isMobile ? '14px' : '16px'}}>Publish</Typography>
                            </Box>
                          </CustomTooltip>
                        </Stack>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* RIGHT: LinkedIn-like preview */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mt: 1 }}>
                  <CardContent>
                    {/* Preview header with toggle */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ fontFamily: "Inter", fontSize: "15px", fontWeight: 500, color: "grey" }}>
                        Post Preview
                      </Typography>
                      {!isMobile && (
                        <ToggleButtonGroup
                          size="small"
                          value={previewMode}
                          exclusive
                          onChange={(_, v) => v && setPreviewMode(v)}
                        >
                          <ToggleButton value="mobile">
                            <PhoneIphoneIcon fontSize="small" sx={{ mr: 1 }} />
                          </ToggleButton>
                          <ToggleButton value="desktop">
                            <LaptopMacIcon fontSize="small" sx={{ mr: 1 }} />
                          </ToggleButton>
                        </ToggleButtonGroup>
                      )}
                    </Stack>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Card sx={{ borderRadius: 3, width: "100%", maxWidth: previewMode === "mobile" ? 380 : 680 }}>
                        <CardContent>
                          {/* Header */}
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                            <Avatar alt="Profile" src={profilePicture} sx={{ width: 48, height: 48 }} />
                            <Box>
                              <Typography sx={{ fontFamily: "Inter", fontWeight: 600 }}>{userName || "You"}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Founder @PostLn.com -LinkedIn AI That Writes Like You.
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">Now</Typography>
                                <PublicOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                              </Stack>
                            </Box>
                          </Stack>

                          {/* TEXT with “…more” overlay (no collapse button) */}
                          <Box sx={{ position: 'relative' }}>
                     <Typography
                                         key={previewMode}
                                         ref={previewBodyRef}
                                         sx={{
                                           fontSize: 16,
                                           lineHeight: 1.5,
                                           whiteSpace: "pre-wrap",
                                           fontFamily: '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif',
                                         }}
                                       >
                                         {postText ? renderWithMore(postText) : "Your formatted post will preview here…"}
                                       </Typography>
                            {/* Fade & “…more” text overlay */}
                            {/* {shouldClamp && (
                              <>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 32,
                                    background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff 70%)',
                                    pointerEvents: 'none'
                                  }}
                                />
                                <Typography
                                  sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    px: 0.5,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    pointerEvents: 'none'
                                  }}
                                >
                                  ...more
                                </Typography>
                              </>
                            )} */}
                          </Box>

                          {selectedImage && (
                            <Box sx={{ mt: 2 }}>
                              <img
                                src={selectedImage}
                                alt="preview"
                                style={{ width:'100%', borderRadius: 8, objectFit:'cover', maxHeight: 320 }}
                              />
                            </Box>
                          )}

                          {/* Reactions summary */}
                          <Box sx={{ mt: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              {/* Left: emoji cluster + total likes */}
                              <Stack direction="row" alignItems="center">
                              
<Stack direction="row" alignItems="center" sx={{ mr: 1 }}>
  {reactions.map((r, i) => (
    <Avatar
      key={i}
      sx={{
        ...overlapAvatar(i),
        bgcolor: r.bg,
        color: "#fff", // ensure emoji/icon is visible
        fontSize: 12
      }}
    >
      {r.icon}
    </Avatar>
  ))}
</Stack>

                                <Typography variant="caption" color="text.secondary">
                                  {reactionCounts.likes} reactions
                                </Typography>
                              </Stack>

                              {/* Right: comments & reposts */}
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">{reactionCounts.comments} comments</Typography>
                                <Typography variant="caption" color="text.secondary">•</Typography>
                                <Typography variant="caption" color="text.secondary">{reactionCounts.reposts} reposts</Typography>
                              </Stack>
                            </Stack>
                          </Box>

                          <Divider sx={{ mt: 1.5, mb: 0.5 }} />

                          {/* Actions bar (Like / Comment / Repost / Send) */}
                          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                            <Button
                              variant="text"
                              onClick={toggleLike}
                              startIcon={<ThumbUpOffAltIcon sx={{ fontSize: 20, color: userReacted ? '#0a66c2' : 'inherit' }} />}
                              sx={{ textTransform: 'none', color: userReacted ? '#0a66c2' : 'text.secondary' }}
                            >
                              Like
                            </Button>
                            <Button
                              variant="text"
                              startIcon={<ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 20 }} />}
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                              onClick={() => {
                                setReactionCounts((rc) => ({ ...rc, comments: rc.comments + 1 }));
                              }}
                            >
                              Comment
                            </Button>
                            <Button
                              variant="text"
                              startIcon={<RepeatOutlinedIcon sx={{ fontSize: 20 }} />}
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                              onClick={() => {
                                setReactionCounts((rc) => ({ ...rc, reposts: rc.reposts + 1 }));
                              }}
                            >
                              Repost
                            </Button>
                            <Button
                              variant="text"
                              startIcon={<SendOutlinedIcon sx={{ fontSize: 20 }} />}
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              Send
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}

      {/* Draft/Confirm Dialog */}
      {drafting ? (
        <Box sx={{ position:'absolute', inset:0, backgroundColor:'rgba(255,255,255,0.8)', zIndex:1000,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <Box sx={{ width:'60%', mb:2 }}>
            <Box sx={{ height:8, backgroundColor:'#ccc', borderRadius:10 }}>
              <Box sx={{ height:'100%', width:'100%', backgroundColor:'#093FB4', borderRadius:10, animation:'loading 2s infinite' }} />
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 500 }}>Saving Draft...</Typography>
        </Box>
      ) : (
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: '16px', fontWeight: 500 }}>
            Save this post as a draft?
            <IconButton onClick={() => setConfirmOpen(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: '16px' }}>The post you started will be here when you return.</Typography>
          </DialogContent>
          <DialogActions sx={{ py:3, px:3 }}>
            <Box onClick={handleDiscard} sx={{ background:'#D7D7D7', borderRadius:'26px', px:3, py:0.7, cursor:'pointer',
              '&:hover':{ background:'#748873', color:'#FFFFFF' } }}>
              <Typography sx={{ fontSize:'16px' }}>Discard</Typography>
            </Box>
            <Box onClick={handleSaveDraft} sx={{
              background: postText?.trim?.() === '' ? '#C4C4C4' : '#093FB4',
              borderRadius:'26px', px:3, py:0.7, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#FFFFFF', cursor: postText?.trim?.() === '' ? 'not-allowed' : 'pointer',
              pointerEvents: postText?.trim?.() === '' ? 'none' : 'auto',
              '&:hover':{ background: postText?.trim?.() === '' ? '#C4C4C4' : '#004030' },
            }}>
              <Typography sx={{ fontSize:'16px' }}>Save as draft</Typography>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => {}} disableEscapeKeyDown hideBackdrop={false} fullWidth maxWidth="xs">
        <DialogTitle>
          <Stack>
            <Typography sx={{ fontSize:'18px', fontWeight:500 }}>Post settings</Typography>
            <Typography sx={{ fontSize:'14px' }}>Who can see your post?</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <Box onClick={() => setPostVisibility("anyone")}
              sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", px:2, py:1.5, borderRadius:2, cursor:"pointer",
                "&:hover":{ backgroundColor:"#f5f5f5" } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ background:'#EAEFEF', p:1, borderRadius:'100%' }}>
                  <PublicOutlinedIcon sx={{ fontSize:26, color:'#000' }}/>
                </Box>
                <Box>
                  <Typography fontWeight={500} fontSize={16}>Anyone</Typography>
                  <Typography fontSize={13} color="text.secondary">Anyone on or off LinkedIn</Typography>
                </Box>
              </Stack>
              <Radio checked={postVisibility === "anyone"} sx={{ "&.Mui-checked":{ color:"#093FB4" }, transform:"scale(1.2)" }} disableRipple />
            </Box>

            <Box onClick={() => setPostVisibility("connections")}
              sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", px:2, py:1.5, borderRadius:2, cursor:"pointer",
                "&:hover":{ backgroundColor:"#f5f5f5" } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ background:'#EAEFEF', p:1, borderRadius:'100%' }}>
                  <GroupAddOutlinedIcon sx={{ fontSize:26, color:'#000' }}/>
                </Box>
                <Box>
                  <Typography fontWeight={500} fontSize={16}>Connections only</Typography>
                  <Typography fontSize={13} color="text.secondary">Only your LinkedIn connections</Typography>
                </Box>
              </Stack>
              <Radio checked={postVisibility === "connections"} sx={{ "&.Mui-checked":{ color:"#093FB4" }, transform:"scale(1.2)" }} disableRipple />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ py:3, px:2 }}>
          <Box onClick={() => setSettingsOpen(false)} sx={{ background:'#D7D7D7', borderRadius:'26px', px:3, py:0.7, cursor:'pointer',
            '&:hover':{ background:'#748873', color:'#FFFFFF' } }}>
            <Typography>Back</Typography>
          </Box>
          <Box onClick={() => setSettingsOpen(false)} sx={{ background:'#093FB4', borderRadius:'26px', px:3, py:0.7, color:'#FFFFFF', cursor:'pointer',
            '&:hover':{ background:'#004030' } }}>
            <Typography>Done</Typography>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog (main) */}
      {scheduling ? (
        <Box sx={{ position:'absolute', inset:0, backgroundColor:'rgba(255,255,255,0.8)', zIndex:1000,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <Box sx={{ width:'60%', mb:2 }}>
            <Box sx={{ height:8, backgroundColor:'#ccc', borderRadius:10 }}>
              <Box sx={{ height:'100%', width:'100%', backgroundColor:'#093FB4', borderRadius:10, animation:'loading 2s infinite' }} />
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 500 }}>Scheduling post...</Typography>
        </Box>
      ) : (
        <Dialog open={scheduleOpen} onClose={() => {}} fullWidth maxWidth="sm" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle>Schedule post</DialogTitle>
          <DialogContent >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Date" value={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} disablePast minDate={dayjs()} />
            </LocalizationProvider>
            <FormControl fullWidth={false} sx={{ mt:3, width: isMobile ? '90%' : '400px' }}>
              <Select
                value={selectedTime}
                displayEmpty
                onChange={(e)=> setSelectedTime(e.target.value)}
                renderValue={(selected)=> selected ? selected : <Typography color="text.secondary">Time</Typography>}
              >
                {getAvailableTimeSlots(selectedDate).map((slot) => (
                  <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px:3, py:3 }}>
            <Box onClick={() => setScheduleOpen(false)} sx={{ background:'#D7D7D7', borderRadius:'26px', px:3, py:0.7, cursor:'pointer',
              '&:hover':{ background:'#748873', color:'#FFFFFF' } }}>
              <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Back</Typography>
            </Box>
            <Box onClick={()=> handleSchedule(postText)} sx={{
              background: postText.trim() === '' ? '#C4C4C4' : '#093FB4',
              borderRadius:'26px', px:3, py:0.7, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#FFFFFF', cursor: postText.trim() === '' ? 'not-allowed' : 'pointer',
              pointerEvents: postText.trim() === '' ? 'none' : 'auto',
              '&:hover':{ background: postText.trim() === '' ? '#C4C4C4' : '#004030' },
            }}>
              <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Schedule</Typography>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* Schedule Dialog (composer) */}
      {scheduling ? (
        <Box sx={{ position:'absolute', inset:0, backgroundColor:'rgba(255,255,255,0.8)', zIndex:1000,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <Box sx={{ width:'60%', mb:2 }}>
            <Box sx={{ height:8, backgroundColor:'#ccc', borderRadius:10 }}>
              <Box sx={{ height:'100%', width:'100%', backgroundColor:'#093FB4', borderRadius:10, animation:'loading 2s infinite' }} />
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 500 }}>Scheduling post...</Typography>
        </Box>
      ) : (
        <Dialog open={scheduleOpenAi} onClose={() => {}} fullWidth maxWidth="sm" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle>Schedule post</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Date" value={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} disablePast minDate={dayjs()} />
            </LocalizationProvider>
            <FormControl fullWidth={false} sx={{ mt:3, width: isMobile ? '90%' : '400px' }}>
              <Select
                value={selectedTime}
                displayEmpty
                onChange={(e)=> setSelectedTime(e.target.value)}
                renderValue={(selected)=> selected ? selected : <Typography color="text.secondary">Time</Typography>}
              >
                {getAvailableTimeSlots(selectedDate).map((slot) => (
                  <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px:3, py:3 }}>
            <Box onClick={() => setScheduleOpenAi(false)} sx={{ background:'#D7D7D7', borderRadius:'26px', px:3, py:0.7, cursor:'pointer',
              '&:hover':{ background:'#748873', color:'#FFFFFF' } }}>
              <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Back</Typography>
            </Box>
            <Box onClick={()=> handleSchedule(editedText)} sx={{
              background: editedText.trim() === '' ? '#C4C4C4' : '#093FB4',
              borderRadius:'26px', px:3, py:0.7, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#FFFFFF', cursor: editedText.trim() === '' ? 'not-allowed' : 'pointer',
              pointerEvents: editedText.trim() === '' ? 'none' : 'auto',
              '&:hover':{ background: editedText.trim() === '' ? '#C4C4C4' : '#004030' },
            }}>
              <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Schedule</Typography>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* Rewrite dialog */}
      <RewriteAiDialog
        open={isRewriteOpen}
        postText={postText}
        onClose={() => setIsRewriteOpen(false)}
        onReplace={(result) => {
          setIsRewriteOpen(false);
          const arr = normalizeRewrites(result);
          setRewrites(arr);
          setVersionsOpen(true);
        }}
      />

      {/* Composer dialog (kept intact, uses editedText/composerText) */}
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
          PaperProps={{ sx: { width: isMobile ? "100%" : "50%", borderRadius: isMobile ? 0 : 3 } }}
        >
          <DialogContent sx={{ position: "relative", pt: 4 }}>
            <IconButton
              onClick={() => { if ((composerText?.trim?.() ?? "") === "") setComposerOpen(false); else setConfirmOpen(true); }}
              sx={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Close composer"
            >
              <CloseIcon />
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar src={profilePicture} />
              <Stack>
                <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>{userName}</Typography>
                <Stack direction="row" gap={1} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setSettingsOpen(true)}>
                  <Typography sx={{ fontSize: '14px', color: 'grey' }}>
                    Post to {postVisibility === "anyone" ? "Anyone" : "Connections only"}
                  </Typography>
                  <ArrowDropDownOutlinedIcon />
                </Stack>
              </Stack>
            </Box>

            <TextField
              inputRef={inputRef}
              multiline
              minRows={8}
              fullWidth
              placeholder="Write your post..."
              value={composerText}
              onChange={(e) => { const val = e.target.value; setComposerText(val); setEditedText(val); }}
              onSelect={(e) => { const target = e.target; setCursorPos(target.selectionStart || 0); }}
            />

            {selectedImage && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ position:'relative', border:'1px solid #eee', borderRadius:2, p:1, bgcolor:'#fafafa' }}>
                  <img
                    src={selectedImage}
                    alt="Selected"
                    style={{ width:'100%', maxHeight: isMobile ? 260 : 420, objectFit:'contain', borderRadius:8, display:'block' }}
                  />
                  <IconButton size="small" onClick={() => setSelectedImage(null)} sx={{ position:'absolute', top:6, right:6, bgcolor:'white' }} aria-label="Remove image">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            <Box sx={{ position:"sticky", bottom:0, width:"100%", backgroundColor:"#fff", borderTop:"1px solid #e0e0e0", px: isMobile ? 0 : 3, py: isMobile ? 0.5 : 1, zIndex:5, mt:2 }}>
              <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                <IconButton onClick={() => handleCopy(composerText)}>
                  <ContentCopyIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
                </IconButton>
                <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} message="Copied!"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
                <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
                  <InsertEmoticonIcon sx={{ fontSize: isMobile ? '20px' : '22px' }} />
                </IconButton>
                {showEmojiPicker && (
                  <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
                    <Box sx={{ position:'absolute', zIndex:10, top:160, right:20 }}>
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
                  <input type="file" hidden accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => { handleImageSelect(e); e.target.value = null; }} />
                </IconButton>
                {(composerText?.length || 0) > 0 && (
                  <Typography sx={{ ml: "auto", fontSize: isMobile ? '12px' : '14px' }}
                    variant="body2"
                    color={(composerText?.length || 0) > CHARACTER_LIMIT ? 'error' : 'text.secondary'}>
                    {(composerText?.length || 0)} / {CHARACTER_LIMIT} characters
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
                <CustomTooltip placement="left" title={(composerText?.length || 0) > CHARACTER_LIMIT ? "Exceeded characters" : "Schedule for later"}>
                  <Box
                    onClick={() => { if ((composerText?.trim?.() || "") && (composerText.length <= CHARACTER_LIMIT)) setScheduleOpenAi(true); }}
                    sx={{
                      background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#093FB4',
                      borderRadius: '4px', px: 1, py: 0.7, display: 'flex', alignItems:'center', justifyContent:'center',
                      color:'#FFFFFF', cursor: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'not-allowed' : 'pointer',
                      pointerEvents: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'none' : 'auto',
                      '&:hover': { background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#004030' },
                    }}
                  >
                    <CalendarMonthIcon />
                  </Box>
                </CustomTooltip>

                <CustomTooltip placement="left" title={(composerText?.length || 0) > CHARACTER_LIMIT ? "Exceeded characters" : ""}>
                  <Box
                    onClick={() => { if ((composerText?.trim?.() || "") && (composerText.length <= CHARACTER_LIMIT)) handlePublish(editedText); }}
                    sx={{
                      background: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? '#C4C4C4' : '#093FB4',
                      borderRadius: '26px', px: 3, py: 0.7, display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#FFFFFF', cursor: (composerText?.trim?.() === '' || (composerText?.length || 0) > CHARACTER_LIMIT) ? 'not-allowed' : 'pointer',
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

      {/* Versions chooser */}
      <Dialog open={versionsOpen} onClose={() => setVersionsOpen(false)} fullScreen>
        <DialogTitle sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:2 }}>
            <Avatar src={profilePicture} />
            <Stack>
              <Typography sx={{ fontSize:'18px', fontWeight:500 }}>{userName}</Typography>
              <Stack direction="row" gap={1} alignItems="center" sx={{ cursor:'pointer' }} onClick={() => setSettingsOpen(true)}>
                <Typography sx={{ fontSize:'14px', color:'grey' }}>
                  Post to {postVisibility === "anyone" ? "Anyone" : "Connections only"}
                </Typography>
                <ArrowDropDownOutlinedIcon />
              </Stack>
            </Stack>
          </Box>
          <IconButton onClick={() => setVersionsOpen(false)}><CloseIcon/></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <Grid container spacing={2}>
            {rewrites.map((item, idx) => {
              const text = typeof item === "string" ? item : item?.post || "";
              return (
                <Grid key={idx} item xs={12} md={4}>
                  <Card variant="outlined" sx={{ height:'100%', display:'flex', flexDirection:'column', borderRadius:2 }}>
                    <CardContent sx={{ flexGrow:1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography sx={{ fontFamily:'Inter', fontSize:'12px', fontWeight:600, color:'grey' }}>
                          Version {idx + 1}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mb:1 }}/>
                      <Typography variant="body2" sx={{ whiteSpace:'pre-wrap' }}>{text}</Typography>
                    </CardContent>
                    <CardActions sx={{ p:2, pt:0, justifyContent:'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => openComposer(text)}
                        variant="contained"
                        sx={{
                          backgroundColor:'#093FB4', borderRadius:'20px', textTransform:'none',
                          fontSize:'14px', fontWeight:500, px:2, py:0.5, boxShadow:'0px 3px 6px rgba(0,0,0,0.15)',
                          '&:hover': { backgroundColor:'#004030' },
                        }}
                      >
                        Use this
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Train prompt */}
      <Dialog open={isTrainDialogOpen} onClose={() => setIsTrainDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Pending: Posts Analysis</DialogTitle>
        <DialogContent dividers>
          <Typography>To unlock rewriting in your own style, please continue with analyzing your past linkedin posts.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTrainDialogOpen(false)}>Cancel</Button>
          <Box onClick={handleContinueToTraining} sx={{
            background:'#093FB4', borderRadius:'26px', px:3, py:0.7, display:'flex',
            alignItems:'center', justifyContent:'center', color:'#FFFFFF', cursor:'pointer',
            '&:hover':{ background:'#004030' },
          }}>
            <Typography sx={{ fontSize: isMobile ? '14px' : '16px' }}>Continue</Typography>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={publishSuccessSnackbar.open}
        autoHideDuration={2000}
        onClose={() => setPublishSuccessSnackbar((prev) => ({ ...prev, open: false }))}
        message={publishSuccessSnackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{ sx: { backgroundColor:'green', color:'#fff', fontWeight:500 } }}
      />

      <style>
        {`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 50%; }
          100% { width: 100%; }
        }
        `}
      </style>
    </>
  );
};

export default PostComposer;
