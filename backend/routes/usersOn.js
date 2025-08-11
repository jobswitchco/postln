import express from "express";
import axios from "axios";
import cookieParser from "cookie-parser";
const router = express.Router();
import USER from "../models/User.js";
import PublishedPosts from "../models/PublishedPosts.js";
import DraftPosts from "../models/DraftPosts.js";
import ScheduledPosts from "../models/ScheduledPosts.js";
import ErroredPosts from "../models/ErroredPosts.js";
import MainTopicsFeed from "../models/MainTopicsFeed.js";
import Categories from "../models/Categories.js";
router.use(cookieParser());
import authenticateToken from "../middleware/authenticateTokenProfessional.js";
import generateJWTtoken  from "../middleware/generateJWTtoken.js";
import https from 'https';
import OpenAI from "openai";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
import multer from "multer";
import fs from "fs";
import { Storage } from '@google-cloud/storage';
const storage = new Storage({ keyFilename: './postln-project-7726ed4a11e6.json' });
const bucketName = "postlnbucketcom"; 
const bucket = storage.bucket(bucketName);
const upload = multer({ dest: "uploads/" });
import cron from "node-cron";
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
import agenda from "./agenda.js";
import { definePublishJob } from "./publishPostJob.js";
definePublishJob(agenda);




const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = "http://www.postln.com/auth/linkedin/callback";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;


// cron.schedule("*/5 * * * *", async () => {
//   console.log("🔄 Checking fine-tune job statuses...");

//   try {
//     const users = await USER.find({
//       model_training_started: true,
//       model_training_finished: false,
//       fine_tune_id: { $exists: true }
//     });

//     for (const user of users) {
//       const fineTuneId = user.fine_tune_id;

//       try {
//         const fineTune = await openai.fineTuning.jobs.retrieve(fineTuneId);
//         console.log(`🧠 ${user.username || user.email} | Status: ${fineTune.status}`);

//         if (fineTune.status === "succeeded" && fineTune.fine_tuned_model) {
//           user.model_training_finished = true;
//           user.fine_tuned_model = fineTune.fine_tuned_model;
//           await user.save();
//           console.log(`✅ Model ready and saved for user ${user._id}`);
//         } else if (fineTune.status === "failed") {
//           user.model_training_finished = true;
//           user.fine_tuned_model = null;
//           await user.save();
//           console.error(`❌ Training failed for user ${user._id}`);
//         }
//       } catch (err) {
//         console.error(`⚠️ Error checking status for user ${user._id}:`, err.message);
//       }
//     }
//   } catch (err) {
//     console.error("🔥 Cron job error:", err.message);
//   }
// });

// export async function generateLinkedInPost(article, modelId) {
//   if (!article || !modelId) {
//     throw new Error("Both article and modelId are required.");
//   }

//   const messages = [
//     {
//       role: "system",
//       content: `You are a linkedIn Professional trained to write a linkedIn post like a specific user. Use their voice, tone, structure, and storytelling style.`,
//     },
//     {
//       role: "user",
//       content: `Write a LinkedIn post based on this article or draft:\n\n"${article}"\n\nOutput should resemble the user's style.`,
//     },
//   ];

//   try {
//     const response = await openai.chat.completions.create({
//       model: modelId,
//       messages,
//       temperature: 0.7,
//       max_tokens: 800,
//     });

//     const post = response.choices[0].message.content.trim();
//     return post;
//   } catch (err) {
//     console.error("❌ Error generating post:", err.message);
//     throw err;
//   }
// }






async function uploadToGCS(filePath, destFileName, mimeType) {
  const fileUpload = bucket.file(destFileName);

  await bucket.upload(filePath, {
    destination: fileUpload,
    resumable: false,
    metadata: {
      contentType: mimeType,
      cacheControl: "public, max-age=31536000",
    },
  });

  await fileUpload.makePublic();
  return `https://storage.googleapis.com/${bucketName}/${destFileName}`;
}


router.post("/upload-image", upload.single("image"), authenticateToken, async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No image uploaded");

    const imageFile = req.file;

      const gcsFilename = `linkedin_uploads/${Date.now()}_${imageFile.originalname}`;
      const mediaUrl = await uploadToGCS(imageFile.path, gcsFilename, imageFile.mimetype);

   
    res.status(200).json({ mediaUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

router.post("/logout", authenticateToken, (req, res) => {
  res.clearCookie("token_professional", {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
});



router.get("/auth/linkedin/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) return res.status(400).send("Missing code");

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("Access Token:", accessToken);

    // Fetch user profile (this gives you name, ID, and localized info)
    const profileResponse = await axios.get("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileResponse.data;
    console.log("Profile Info:", profile);

    // Fetch email address separately
    const emailResponse = await axios.get(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const email = emailResponse.data.elements[0]["handle~"].emailAddress;

    // Combine and respond
    const user = {
      id: profile.id,
      firstName: profile.localizedFirstName,
      lastName: profile.localizedLastName,
      email,
      headline: profile.headline || '', // Only if available via enhanced permissions
    };

    res.status(200).json({ user });
  } catch (err) {
    console.error("LinkedIn OAuth Error:", err.response?.data || err);
    res.status(500).send("OAuth Failed");
  }
});

router.post("/send_linkedin_code", async (req, res) => {
 
  const code = req.body.code;

  if (!code) return res.status(400).send("Missing code from LinkedIn");

  try {
    // STEP 1: Exchange code for access token
    const tokenRes = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", null, {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const access_token = tokenRes.data.access_token;
    const accessToken_expires_in = tokenRes.data.expires_in;

    // STEP 2: Fetch user's LinkedIn profile
    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const sub = profileRes.data.sub;
    const name = profileRes.data.name;
    const email = profileRes.data.email;
    const picture = profileRes.data.picture;

     let user = await USER.findOne({ email });

    const now = new Date();
    let wasNew = false;

      if (!user) {
      // Create new user if they don't exist
      user = await USER.create({
        email,
        name,
        sub,
        picture,
        access_token,
        accessToken_expires_in,
        is_google_user: true,
        last_login: now,
        loginHistory: [now]
      });
      wasNew = true;
    } else {
      // Update last_login and append to loginHistory
     await USER.updateOne(
  { _id: user._id },
  {
    $set: {
      last_login: now,
      updated_at: now,
      access_token,
      accessToken_expires_in
    },
    $push: {
      loginHistory: now
    }
  }
);


    }

      const token = await generateJWTtoken(user._id, user.email);

    res.cookie("token_professional", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    return res.status(200).json({
      success: true,
      message: wasNew ? "User registered successfully" : "User logged in successfully",
      user: {
        user_id: user._id,
        user_email: user.email,
      },
      token,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: "An error occurred",
    });
  }
});


router.get("/verify-login-token", authenticateToken, async (req, res) => {
  return res.status(200).json({ valid: true, user: req.user });
});


router.post('/are-topics-added', authenticateToken, async function (req, res) {

 const user_id = req.user?.user_id;

  if (!user_id) {
    return res.status(400).json({ message: "Username is invalid." });
  }

  try {
    const result = await USER.findById(user_id);

   if (result) {
  return res.status(200).send({ success: true, added: result.profile_added === true, analysisAdded: result.posts_analyzed === true});
} else {
  return res.status(404).send({ success: false, message: "User not found" });
}

  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/are-posts-analyzed', authenticateToken, async (req, res) => {
  const user_id = req.user?.user_id;
  const user = await USER.findById(user_id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const modelStarted = user.model_training_started;
  const modelReady = user.model_training_finished;

  let minutesLeft = null;

  if (modelStarted && !modelReady && user.model_start_time) {
    const startedAt = new Date(user.model_start_time).getTime();
    const now = Date.now();
    const timeElapsed = Math.floor((now - startedAt) / 60000); // in minutes
    minutesLeft = Math.max(0, 30 - timeElapsed); // Assuming 30 minutes max
  }

  return res.json({
    success: true,
    model_started: modelStarted,
    model_ready: modelReady,
    minutes_left: minutesLeft,
  });
});


  router.get('/get-user-details', authenticateToken, async function (req, res){

    const userId = req.user?.user_id;

        if (!userId) {
          return res.status(400).json({ message: "Username is invalid." });
        }
  
    USER.findById(userId).then((result)=>{
  
      if(result){
  
      res.status(200).send({ success: true, data: { name: result.name, lastLogin: result.last_login, linkedInUrl : result.linkedinUrl}});
      res.end();

  
      }
  
      else{
      res.status(200).send({ success: false, data: null });
      res.end();
  
      }
  
    }).catch(e2=>{
  
      console.error("❌ Error fetching campaign details:", e2);
      return res.status(500).json({ error: "Internal Server Error" });
  
    })
  });

router.get("/get-categories", authenticateToken, async (req, res) => {
  try {

 const userId = req.user?.user_id;


  if (!userId) {
    return res.status(400).json({ error: "Missing user or category" });
  }

    const categories = await Categories.find({}, "_id category");
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/save-selected-category", authenticateToken, async (req, res) => {
  const userId = req.user?.user_id;
  const { categoryIds } = req.body; // Expecting an array of IDs

  if (!userId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    return res.status(400).json({ error: "Missing user or valid categories" });
  }

  try {
    // 1. Save categories into USER document
    await USER.updateOne(
      { _id: userId },
      {
        $set: {
          categories: categoryIds,
          updated_at: new Date(),
        },
      }
    );

    // 2. Fetch all unique topics from selected categories
    const categories = await Categories.find({ _id: { $in: categoryIds } });

    const allTopics = categories.flatMap((cat) => cat.topics || []);
    const uniqueTopics = [...new Set(allTopics)];

    res.json({
      success: true,
      topics: uniqueTopics,
    });
  } catch (err) {
    console.error("Error saving categories:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/save-selected-topics", authenticateToken, async (req, res) => {
  const userId = req.user?.user_id;
  const { topics } = req.body;

  if (!userId || !Array.isArray(topics)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  await USER.updateOne(
    { _id: userId },
    { $set: { topics, updated_at: new Date(), profile_added: true } }
  );

  res.json({ success: true });
});


router.get("/get-topics-of-user", authenticateToken, async (req, res) => {
  
  const userId = req.user?.user_id;

  try {
    const user = await USER.findById(userId).populate("categories");
    if (!user) return res.status(404).json({ message: "User not found" });

    const userTopics = user.topics || [];

    const allTopics = user.categories.flatMap((cat) => cat.topics || []);
    const uniqueTopics = [...new Set(allTopics)];

    const result = uniqueTopics.map((topic) => ({
      name: topic,
      selected: userTopics.includes(topic),
    }));

    return res.status(200).json({ fetched: true, message: "Topics updated", result });
  } catch (err) {
    console.error("Error fetching topics:", err);
    return res.status(500).json({ fetched: false, message: "Server error" });
  }
});

router.post("/update-topics-of-user", authenticateToken, async (req, res) => {
  const userId = req.user?.user_id;
  const { selectedTopics } = req.body;

  if (!Array.isArray(selectedTopics)) {
    return res.status(400).json({ message: "selectedTopics must be an array" });
  }

  try {
    const user = await USER.findByIdAndUpdate(
      userId,
      { topics: selectedTopics },
      { new: true }
    );

    return res.status(200).json({ updated: true, message: "Topics updated", topics: user.topics });
  } catch (err) {
    console.error("Error updating topics:", err);
    return res.status(500).json({ updated: false, message: "Failed to update topics" });
  }
});

router.get("/get-user-name-image", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await USER.findById(userId).select("name picture");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      profilePicture: user.picture || null, // fallback to null if not set
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});


const sanitizeInput = async (text) => {
  return text
    .replace(/^#+\s*(.*)/gm, '$1')                          // Remove markdown headings (### Heading → Heading)
    .replace(/^\s*[*\-+]\s+\*{2}(.*?)\*{2}[:]?/gm, '→ "$1":') // Bullet: * **Point:** → → "Point":
    .replace(/^\s*[*\-+]\s+\*{2}(.*?)\*{2}/gm, '→ "$1"')     // Bullet: * **Point** → → "Point"
    .replace(/^\s*[*\-+]\s+(.*)/gm, '→ $1')                  // Bullet: * Point → → Point
    .replace(/\*{2}([^*]+)\*{2}/g, '"$1"')                   // **bold** → "bold"
    .replace(/\*([^*]+)\*/g, '"$1"')                         // *italic* → "italic"
    .replace(/`([^`]+)`/g, '"$1"')                           // `inline` → "inline"
    .replace(/\*/g, '')                                      // Remove stray *
    .replace(/\n{3,}/g, '\n\n')                              // Normalize breaks
    .trim();
};




export async function generateLinkedInPost(article, modelId) {
  if (!article || !modelId) {
    throw new Error("Both article and modelId are required.");
  }

  const messages = [
    {
      role: "system",
      content: `"You are my LinkedIn Ghostwriter trained on my style. Your job is to *faithfully represent the article's or draft's key points*, while expressing them in my unique tone — which may include emojis, questions, short paragraphs, or strong closings. You transform inputs into my voice and structure — while keeping original facts, characters, and quotes untouched. You NEVER change the subject's gender or invent details. Preserve the language(ex: if draft is given in english then output post should be in english language only), And most importantly, do not return asterisks(*) anywhere in the post."
`,
    },


{
  role: "user",
  content: `Rewrite the following article into a LinkedIn post that reflects my tone and storytelling style.

Keep it engaging, slightly informal, and personalized — but make sure the key insights from the article are **preserved clearly**.

Avoid copying the article directly, but don't go off-topic either. The goal is to **explain the same ideas in my style**.\n\n"${article}"`
}


  ];

  try {
    const generationResponse = await openai.chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.75,
      max_tokens: 800,
    });

    const post = generationResponse.choices[0].message.content.trim();

    // Ask the same model to rate its own generated post
    const ratingMessages = [
      {
        role: "system",
        content: `You are the same fine-tuned model trained on a specific user's style. You just generated the following post based on their past writing style.`,
      },
      {
        role: "user",
        content: `Here is the post you just generated:\n\n"${post}"\n\nRate how well this matches your trained style on a scale of 1 to 10, and provide a short explanation.`,
      },
    ];

    const ratingResponse = await openai.chat.completions.create({
      model: modelId,
      messages: ratingMessages,
      temperature: 0.3,
      max_tokens: 200,
    });

    const rating = ratingResponse.choices[0].message.content.trim();

    return {
      post,
      rating,
    };
  } catch (err) {
    console.error("❌ Error generating or rating post:", err.message);
    throw err;
  }
}

// fine_tune_id: ftjob-bVeBcCJ9czgmd5PGGKUpnvwW

// const ankur_modelId = "ft:gpt-3.5-turbo-0125:audiotostory:ankur-warikoo:BwmUVxcg";
// const satya_modelId = "ft:gpt-3.5-turbo-0125:audiotostory:6871557baa4a0d12283c92cd:BxHEv9Hw";
// const komal_modelId = "ft:gpt-3.5-turbo-0125:audiotostory:6871557baa4a0d12283c92cd:BxPg3qyU";
// const ankur_latest_modelId = "ft:gpt-3.5-turbo-0125:audiotostory:6871557baa4a0d12283c92cd:BxQrCN8y";


router.post('/transcribe-whisper', async (req, res) => {
  try {
    const { voiceText } = req.body;

    if (!voiceText) {
      return res.status(400).json({ error: "No voiceText provided" });
    }

    // Optional: send to Whisper for correction (but browser transcript is usually accurate)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a transcription assistant. Correct any voice input errors." },
        { role: "user", content: voiceText }
      ],
    });

    const corrected = response.choices[0]?.message?.content?.trim() || voiceText;

    return res.status(200).json({ transcribedText: corrected });
  } catch (error) {
    console.error("Whisper error:", error);
    res.status(500).json({ error: "Failed to process voice input" });
  }
});


router.post('/rewrite-post', authenticateToken, async (req, res) => {
 
  const user_id = req.user?.user_id;

  const { textPost } = req.body;

  const postText = await sanitizeInput(textPost);

  try {
     
    const { fine_tuned_model } = await USER.findById(user_id).lean().select('fine_tuned_model');

    const generatedPostLn = await generateLinkedInPost(postText, fine_tuned_model)
  .then((post, rating) => {
    return post;
  })
  .catch(console.error);

    res.json({
      rewrittenText: generatedPostLn,
    });
  } catch (error) {
    console.error('Rewrite error:', error);
    res.status(500).json({ error: 'Failed to rewrite post' });
  }
});


router.post('/analyze-writing-style', authenticateToken, async (req, res) => {
  const user_id = req.user?.user_id;
  const { linkedinUrl } = req.body;

  if (!linkedinUrl) {
    return res.status(400).json({ error: 'LinkedIn URL is required' });
  }


  try {

    await USER.findByIdAndUpdate(user_id, {
  model_training_started: true,
  model_start_time: new Date(), // store the current timestamp
});

    const cloudFunctionUrl = 'https://user-persona-model-802722937988.us-central1.run.app';

    const payload = {
      user_id,
      linkedinUrl
    };

    const response = await axios.post(cloudFunctionUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // console.log('cloudFunction response:', response.data);

    // res.json({ success: true });

  } catch (err) {
    console.error('Style analysis failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to analyze and save writing style' });
  }
});



router.post("/publish-text-post", authenticateToken, async (req, res) => {
  
  
  const userId = req.user?.user_id;
  const { postText } = req.body;

  if (!postText) {
    return res.status(400).json({ message: "Post text is required" });
  }

  try {
    const user = await USER.findById(userId);
    if (!user || !user.access_token ) {
      return res.status(400).json({ message: "Missing LinkedIn credentials" });
    }

    const url = "https://api.linkedin.com/v2/ugcPosts";
    const headers = {
      Authorization: `Bearer ${user.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };

    const personURN = 'urn:li:person:'+user.sub;

    const payload = {
      author: personURN,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: postText },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await axios.post(url, payload, { headers });

    if (response.status === 201) {
      const post_id = response.data.id;
      const post_id_urn_number = post_id.split(":").pop();

      await PublishedPosts.create({
        user_id: userId,
        post_type: "text",
        postText,
        post_id,
        post_id_urn_number,
      });

      return res.status(201).json({ message: "Post published", post_id, published: true });
    } else {
      // Unexpected response but not an error
      await DraftPosts.create({
        user_id: userId,
        post_type: "text",
        postText,
      });
      return res.status(202).json({ message: "LinkedIn responded with non-201, saved as draft", published: false });
    }

  } catch (error) {
    console.error("LinkedIn Post Error:", error.response?.data || error.message);

    // Save to drafts in case of any failure
    await DraftPosts.create({
      user_id: userId,
      post_type: "text",
      postText,
    });

    return res.status(500).json({ message: "Failed to publish post. Saved as draft." });
  }
});



router.post("/publish-media-post", upload.single("image"), authenticateToken, async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ message: "Unauthorized: No session user" });

  try {
    const user = await USER.findById(userId);
    if (!user || !user.access_token) {
      return res.status(400).json({ message: "LinkedIn data missing from user profile" });
    }

    const accessToken = user.access_token;
    const personURN = `urn:li:person:${user.sub}`;
    const { postText } = req.body;
    const imageFile = req.file;

    if (!postText) return res.status(400).json({ message: "postText is required" });

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    };

    let media = null;
    let media_url = null;

    if (imageFile) {
      // Upload to LinkedIn
      const registerRes = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          registerUploadRequest: {
            owner: personURN,
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        { headers }
      );

      const uploadUrl = registerRes.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      const assetURN = registerRes.data.value.asset;

      const imageData = fs.readFileSync(imageFile.path);
      await axios.put(uploadUrl, imageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": imageFile.mimetype,
          "Content-Length": imageData.length,
        },
      });

      // Upload to GCS
      const gcsFilename = `linkedin_uploads/${Date.now()}_${imageFile.originalname}`;
      media_url = await uploadToGCS(imageFile.path, gcsFilename, imageFile.mimetype);

      // Build media block
      media = {
        status: "READY",
        description: { text: "Image Description" },
        media: assetURN,
        title: { text: "Uploaded Image" },
      };

      fs.unlinkSync(imageFile.path); // Delete local file
    }

    // Build LinkedIn UGC Post
    const postBody = {
      author: personURN,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: postText },
          shareMediaCategory: media ? "IMAGE" : "NONE",
          media: media ? [media] : [],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const postRes = await axios.post("https://api.linkedin.com/v2/ugcPosts", postBody, { headers });

    if (postRes.status === 201) {
      const post_id = postRes.data.id;
      const post_id_urn_number = post_id.split(":").pop();

      await PublishedPosts.create({
        user_id: userId,
        post_type: "media",
        postText,
        post_id,
        post_id_urn_number,
        media_url,
      });

      return res.status(201).json({ message: "Post published", post_id, published: true});
    } else {
      // Save as draft
      await DraftPosts.create({
        user_id: userId,
        post_type: "media",
        postText,
        media_url,
      });

      return res.status(202).json({ message: "LinkedIn responded with non-201, saved as draft", published: false });
    }
  } catch (error) {
    console.error("LinkedIn publish error:", error.response?.data || error.message);

    // Save as draft in case of error
    let media_url = null;
    if (req.file) {
      const gcsFilename = `linkedin_uploads/${Date.now()}_${req.file.originalname}`;
      media_url = await uploadToGCS(req.file.path, gcsFilename, req.file.mimetype);
      fs.unlinkSync(req.file.path);
    }

    await DraftPosts.create({
      user_id: req.user.user_id,
      post_type: "media",
      postText: req.body.postText,
      media_url,
    });

    return res.status(500).json({ message: "Failed to publish post. Saved as draft.", published: false });
  }
});


router.post("/schedule-text-post", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { postText, scheduledAt } = req.body;

    if (!postText || !scheduledAt) {
      return res.status(400).json({ error: "postText and scheduledAt are required." });
    }

    const newScheduledPost = new ScheduledPosts({
      user_id: userId,
      postText,
      publish_at: new Date(scheduledAt),
      post_type: "text",
      created_at: new Date()
    });

    const savedPost = await newScheduledPost.save();

    // 👇 Schedule the Agenda job
    await agenda.start(); // starts the agenda job processor
    await agenda.schedule(savedPost.publish_at, "publish scheduled post", {
      postId: savedPost._id,
      user_id: userId

    });


    return res.status(200).json({ scheduled: true });
  } catch (error) {
    console.error("Error scheduling post:", error);
    return res.status(500).json({ error: "Failed to schedule post." });
  }
});


router.post("/schedule-media-post", upload.single("image"), authenticateToken, async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ message: "Unauthorized: No session user" });

  const { postText, schedule_at } = req.body;

  // const scheduledAt = '2025-07-23T18:36:00.000Z';

  const imageFile = req.file;

  if (!postText || !schedule_at) {
    return res.status(400).json({ message: "Missing postText or schedule_at" });
  }

  try {
    let media_url = null;

    if (imageFile) {
      const gcsFilename = `linkedin_uploads/${Date.now()}_${imageFile.originalname}`;
      media_url = await uploadToGCS(imageFile.path, gcsFilename, imageFile.mimetype);
      fs.unlinkSync(imageFile.path); // Delete local file
    }

      const newScheduledPost = new ScheduledPosts({
      user_id: userId,
      post_type: "media",
      postText,
      media_url,
      publish_at: new Date(schedule_at),
      created_at: new Date()
    });

    const savedPost = await newScheduledPost.save();

    // 👇 Schedule the Agenda job
    await agenda.start(); // starts the agenda job processor
    await agenda.schedule(savedPost.publish_at, "publish scheduled post", {
      postId: savedPost._id,
      user_id: userId
    });

    return res.status(201).json({ scheduled: true });
  } catch (error) {
    console.error("Schedule media post error:", error);
    return res.status(500).json({ message: "Failed to schedule media post" });
  }
});

router.post("/save-draft-text-post", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { postText, postType } = req.body;

    if (!postText || postType !== "text") {
      return res.status(400).json({ error: "postText and valid postType are required." });
    }

    const newDraft = new DraftPosts({
      user_id: userId,
      postText,
      post_type: postType, // must be "text"
      created_at: new Date(),
    });

    await newDraft.save();

    return res.status(200).json({ draftSaved: true });
  } catch (error) {
    console.error("Error saving draft:", error);
    return res.status(500).json({ error: "Failed to save draft." });
  }
});


router.post("/save-draft-media-post", upload.single("image"), authenticateToken, async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ message: "Unauthorized: No session user" });

  const { postText, postType } = req.body;
  const imageFile = req.file;

  if (!postText || postType !== "media") {
    return res.status(400).json({ message: "Missing postText or invalid postType" });
  }

  try {
    let media_url = null;

    if (imageFile) {
      const gcsFilename = `linkedin_drafts/${Date.now()}_${imageFile.originalname}`;
      media_url = await uploadToGCS(imageFile.path, gcsFilename, imageFile.mimetype);
      fs.unlinkSync(imageFile.path); // clean up
    }

    const newDraft = new DraftPosts({
      user_id: userId,
      postText,
      media_url,
      post_type: postType, // must be "media"
      created_at: new Date(),
    });

    await newDraft.save();

    return res.status(201).json({ draftSaved: true });
  } catch (error) {
    console.error("Save draft media post error:", error);
    return res.status(500).json({ message: "Failed to save draft." });
  }
});



router.post("/update-linkedin-post", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { document_id, postText, mediaUrl, modifiedDate } = req.body;

    if (!document_id || !userId) {
      return res.status(400).json({ error: "Missing document ID or user ID" });
    }

    const updateFields = {};
    if (postText !== undefined) updateFields.postText = postText;
    if (mediaUrl !== undefined) updateFields.media_url = mediaUrl;
    if (modifiedDate !== undefined) updateFields.publish_at = new Date(modifiedDate);

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No changes provided to update" });
    }

    const updated = await ScheduledPosts.findOneAndUpdate(
      { _id: document_id, user_id: userId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    res.status(200).json({ success: true, updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update scheduled post" });
  }
});

router.post('/delete-draft-post', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { postId } = req.body;

    if (!(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid postId' });
    }

    const deleted = await DraftPosts.findOneAndDelete({
      _id: postId,
      user_id: userId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Draft post not found' });
    }

    res.json({ success: true, message: 'Draft post deleted' });
  } catch (err) {
    console.error('Error deleting draft post:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post("/get-user-posts-by-date", authenticateToken, async (req, res) => {
  const { start, end } = req.body;
  const user_id = req.user?.user_id;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and end timestamps required" });
  }

  try {
    const startDate = new Date(start);
    const endDate = new Date(end); 

    const [Published, Scheduled, Errored, Drafts] = await Promise.all([
      PublishedPosts.find({ user_id, created_at: { $gte: startDate, $lte: endDate } }),
      ScheduledPosts.find({ user_id, publish_at: { $gte: startDate, $lte: endDate } }),
      ErroredPosts.find({ user_id }),
      DraftPosts.find({ user_id }),
    ]);

    res.json({ Published, Scheduled, Errored, Drafts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Utility to get start of today
const startOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

function extractSourceName(url) {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch {
    return "Unknown Source";
  }
}

function cleanJSONResponse(rawText) {
  // Remove markdown-style code block wrapper if present
  return rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
}


// async function fetchFromPerplexity(topic, region) {
//   const prompt = `
// You are an expert AI research assistant.

// Return the top 9 trending articles about the topic "${topic}" in the "${region}" region as of today.

// Each article should include:
// - "title": a compelling and specific headline (string)
// - "summary": a 900-1200 word human-readable summary

// Format summary:
// - Use "###" for subheadings
// - Use "-" for bullet points
// - Use **bold text** for highlights
// - Write clean, professional, LinkedIn-style summaries

// Include:
// - "title": string
// - "summary": formatted string
// - "sources": array of 3–5 URLs

// Return ONLY a valid JSON array of 9 article objects.
// `;

//   const response = await axios.post(
//     PERPLEXITY_API_URL,
//     {
//       model: "sonar-pro",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.65,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
//       },
//     }
//   );

//    let content = response.data?.choices?.[0]?.message?.content;

//   if (typeof content === "string") {
//     try {
//       content = cleanJSONResponse(content);
//       return JSON.parse(content);
//     } catch (err) {
//       console.error("❌ Failed to parse Perplexity JSON:", err.message);
//       console.error("✉️ Content received:\n", content);
//       return [];
//     }
//   }

//  return content;
// }


async function fetchFromPerplexity(topic, region, existingTitles = []) {
  const formattedTitles = existingTitles
    .slice(0, 50) // Limit to last 50 titles to avoid long prompts
    .map((t, i) => `${i + 1}. ${t}`)
    .join('\n');

  const prompt = `
You are an expert AI research assistant.

Return **9 new and trending** articles about the topic "${topic}" in the "${region}" region **as of today**.

You must **exclude** any articles with the following titles:

${formattedTitles}

Each article should include:
- "title": a compelling and specific headline (string)
- "summary": a 900-1200 word human-readable summary

Format summary:
- Use "###" for subheadings
- Use "-" for bullet points
- Use **bold text** for highlights
- Write clean, professional, LinkedIn-style summaries

Include:
- "title": string
- "summary": formatted string
- "sources": array of 3–5 URLs

Return ONLY a valid JSON array of 9 article objects.
`;

  const response = await axios.post(
    PERPLEXITY_API_URL,
    {
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
    }
  );

  let content = response.data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    try {
      content = cleanJSONResponse(content); // your cleanup function
      return JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse Perplexity JSON:", err.message);
      console.error("✉️ Content received:\n", content);
      return [];
    }
  }

  return content;
}



router.get('/get-location-from-ip', (req, res) => {
  const options = {
    host: 'ipapi.co',
    path: '/json/',
    port: 443,
    headers: { 'User-Agent': 'nodejs-ipapi-v1.02' }
  };

  https.get(options, (response) => {
    let body = '';

    response.on('data', (chunk) => {
      body += chunk;
    });

    response.on('end', () => {
      try {
        const location = JSON.parse(body);
        const result = {
          country_code: location.country || 'US',
          country_name: location.country_name || 'United States'
        };
        res.status(200).json(result);
      } catch (err) {
        console.error('Failed to parse IP location data:', err);
        // Default fallback
        res.status(200).json({
          country_code: 'US',
          country_name: 'United States'
        });
      }
    });
  }).on('error', (err) => {
    console.error('Failed to fetch IP location:', err);
    // Default fallback
    res.status(200).json({
      country_code: 'US',
      country_name: 'United States'
    });
  });
});




// router.post("/fetch-articles-for-user", authenticateToken, async (req, res) => {
//   const { topic, region, page = 1, limit = 9 } = req.body;

//   if (!topic || !region) {
//     return res.status(400).json({ error: "Missing topic or region." });
//   }

//   const normalizedTopic = topic.toLowerCase();
//   console.log('normalizedTopic : ', normalizedTopic);
//   const skip = (page - 1) * limit;
//   const query = {
//     keyword: normalizedTopic,
//     region,
//     fetchedAt: { $gte: startOfToday() },
//   };

//   try {
//     let existingArticles = await MainTopicsFeed.find(query).sort({ publishedAt: -1 });
//     let totalCount = existingArticles.length;
//     let finalArticles = existingArticles.slice(skip, skip + limit);

//     // Retry up to 2 times if not enough articles
//     let retries = 2;
//     while (finalArticles.length < limit && retries > 0) {
//       console.log(`Retrying Perplexity fetch... (${3 - retries}/2)`);

//       const perplexityData = await fetchFromPerplexity(topic, region);

//       if (!Array.isArray(perplexityData)) {
//         console.error("Invalid structure from Perplexity:", perplexityData);
//         break;
//       }

//       const existingTitles = new Set(existingArticles.map((a) => a.title));

//       const newEntries = perplexityData
//         .filter((item) => item.title && !existingTitles.has(item.title))
//         .slice(0, 15)
//         .map((item) => ({
//           keyword: normalizedTopic,
//           region,
//           title: item.title || "",
//           summary: item.summary || "",
//           url: item.sources?.[0] || "",
//           source: extractSourceName(item.sources?.[0] || ""),
//           publishedAt: new Date(),
//           image: "",
//           language: "en",
//           fetchedAt: new Date(),
//         }));

//       if (newEntries.length > 0) {
//         await MainTopicsFeed.insertMany(newEntries);
//       }

//       // 🔁 Re-fetch the updated articles from DB
//       existingArticles = await MainTopicsFeed.find(query).sort({ publishedAt: -1 });
//       totalCount = existingArticles.length;
//       finalArticles = existingArticles.slice(skip, skip + limit);

//       retries--;
//     }

//     return res.json({
//       success: true,
//       data: finalArticles,
//       page,
//       totalPages: Math.ceil(totalCount / limit),
//       totalCount,
//     });

//   } catch (err) {
//     console.error("Server error in fetch-articles-for-user:", err?.response?.data || err.message);
//     return res.status(500).json({ error: "Server error. Try again later." });
//   }
// });


router.post("/fetch-articles-for-user", authenticateToken, async (req, res) => {
  const { topic, region, page = 1, limit = 9 } = req.body;

  if (!topic || !region) {
    return res.status(400).json({ error: "Missing topic or region." });
  }

  const normalizedTopic = topic.toLowerCase();
  const skip = (page - 1) * limit;
  const query = {
    keyword: normalizedTopic,
    region,
    fetchedAt: { $gte: startOfToday() },
  };

  try {
    let existingArticles = await MainTopicsFeed.find(query).sort({ publishedAt: -1 });
    let totalCount = existingArticles.length;
    let finalArticles = existingArticles.slice(skip, skip + limit);

    const requiredCount = page * limit;

    // Only fetch from Perplexity if not enough articles exist
    if (totalCount < requiredCount) {
      let retries = 2;

      const existingTitles = await MainTopicsFeed.find(query).distinct("title");

      while (finalArticles.length < requiredCount && retries > 0) {
        console.log(`🔁 Retrying Perplexity fetch... (${3 - retries}/2)`);

        const perplexityData = await fetchFromPerplexity(topic, region, existingTitles);

        if (!Array.isArray(perplexityData)) {
          console.error("❌ Invalid structure from Perplexity:", perplexityData);
          break;
        }

        const newEntries = perplexityData
          .filter((item) => item.title && !existingTitles.includes(item.title))
          .map((item) => ({
            keyword: normalizedTopic,
            region,
            title: item.title || "",
            summary: item.summary || "",
            url: item.sources?.[0] || "",
            sources: item.sources || [],
            source: extractSourceName(item.sources?.[0] || ""),
            publishedAt: new Date(),
            image: "",
            language: "en",
            fetchedAt: new Date(),
          }));

        if (newEntries.length > 0) {
          await MainTopicsFeed.insertMany(newEntries);
          // Update title list
          existingTitles.push(...newEntries.map((e) => e.title));
        }

        // Re-query
        existingArticles = await MainTopicsFeed.find(query).sort({ publishedAt: -1 });
        totalCount = existingArticles.length;
        finalArticles = existingArticles.slice(skip, skip + limit);

        retries--;
      }
    }

    return res.json({
      success: true,
      data: finalArticles,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });

  } catch (err) {
    console.error("❌ Server error in fetch-articles-for-user:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Server error. Try again later." });
  }
});






const categoryTopics = [
  {
    category: "Public Speaker",
     topics: [
      "Entrepreneurship", "Leadership", "SEO", "Writing", "Management", "Creativity",
  "Economics", "Photography", "Content Marketing", "Programming", "Data Science", "Marketing",
  "Productivity", "Motivation", "Comics", "Gaming", "Food", "Travel", "Music", "Culture",
  "Crafts", "Dating", "Real Estate", "Healthcare", "Financial Services", "Cybersecurity",
  "Biopharma", "Pharma", "Automotive"
    ]
  },
 {
  category: "Founder / Maker",
  topics: [
    "Entrepreneurship", "Startups", "Product Development", "Leadership", "Innovation",
    "Fundraising", "No-Code", "Productivity", "Bootstrapping", "Team Building",
    "Marketing", "Sales", "Growth Hacking", "Customer Experience", "SaaS",
    "Venture Capital", "Business Strategy", "Remote Work", "Branding", "Creativity"
  ]
},
 {
  category: "Content Creator",
  topics: [
    "Writing", "Personal Branding", "Storytelling", "Video Creation", "Podcasting",
    "SEO", "Social Media", "Content Strategy", "Photography", "Creativity",
    "Audience Building", "YouTube", "Instagram", "LinkedIn", "Productivity",
    "Email Marketing", "Newsletter", "Motivation", "Copywriting", "Community Building"
  ]
},

{
  category: "HR",
  topics: [
    "Talent Acquisition", "Recruitment", "Employee Engagement", "Leadership",
    "Organizational Culture", "Diversity & Inclusion", "Performance Management",
    "HR Technology", "Workplace Trends", "People Analytics", "L&D",
    "Remote Work", "Succession Planning", "Compensation", "Wellbeing",
    "Change Management", "Employer Branding", "Onboarding", "Career Development", "Compliance"
  ]
},

 {
  category: "Career Coach",
  topics: [
    "Resume Writing", "Interview Tips", "Personal Branding", "Career Change",
    "LinkedIn Optimization", "Job Search Strategy", "Networking", "Soft Skills",
    "Motivation", "Confidence Building", "Public Speaking", "Leadership",
    "Time Management", "Productivity", "Work-Life Balance", "Growth Mindset",
    "Coaching", "Negotiation", "Goal Setting", "Mindfulness"
  ]
},

{
  category: "Marketer / Sales",
  topics: [
    "Marketing Strategy", "Sales Tactics", "Lead Generation", "Copywriting",
    "Branding", "Funnels", "CRM", "Digital Advertising", "Email Marketing",
    "SEO", "Social Selling", "Content Marketing", "Product Marketing", "Cold Outreach",
    "Growth Hacking", "Customer Retention", "B2B", "Analytics", "AB Testing", "Pitching"
  ]
}

];

// ✅ Async Runner Function
async function runInsert() {
  try {
 

    const result = await Categories.insertMany(categoryTopics);
    console.log(`✅ Inserted ${result.length} categories.`);

  } catch (error) {
    console.error("❌ Error during insertion:", error);
  }
}

// ▶️ Run the function
// runInsert();








// insertRoles();


export default router;
