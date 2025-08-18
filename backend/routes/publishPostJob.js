import ScheduledPosts from "../models/ScheduledPosts.js";
import USER from "../models/User.js";
import PublishedPosts from "../models/PublishedPosts.js";
import axios from "axios";


export const definePublishJob = (agenda) => {
  agenda.define("publish scheduled post", async (job, done) => {
    const { postId, user_id  } = job.attrs.data;

    try {
      const post = await ScheduledPosts.findById(postId);
      const user = await USER.findById(user_id);
      if (!post || !user || !user.access_token) throw new Error("Post or user not found");

      const personURN = `urn:li:person:${user.sub}`;
      const accessToken = user.access_token;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      };

      let shareMediaCategory = "NONE";
      let media = [];

      // ⬇️ Handle image upload if it's a media post
      if (post.post_type === "media" && post.media_url) {
        // 1. Download image from public URL
        const response = await axios.get(post.media_url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

        // 2. Register image upload
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

        // 3. Upload image
        await axios.put(uploadUrl, buffer, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "image/jpeg", // Change if not jpeg
            "Content-Length": buffer.length,
          },
        });

        // 4. Prepare media block
        shareMediaCategory = "IMAGE";
        media.push({
          status: "READY",
          description: { text: "Image Description" },
          media: assetURN,
          title: { text: "Uploaded Image" },
        });
      

      // 📝 Final LinkedIn post payload
      const payload = {
        author: personURN,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: post.postText },
            shareMediaCategory,
            media,
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const publishRes = await axios.post("https://api.linkedin.com/v2/ugcPosts", payload, { headers });

      if (publishRes.status === 201) {
        const post_id = publishRes.data.id;
        const post_id_urn_number = post_id.split(":").pop();

        await PublishedPosts.create({
          user_id,
          post_type: post.post_type,
          postText: post.postText,
          post_id,
          post_id_urn_number,
          media_url: post.media_url || null,
        });

          post.post_status = "published";
      post.updated_at = new Date();
      await post.save();

        await ScheduledPosts.findByIdAndDelete(postId);


      done();

    }

  

      
      } 
      
         else if(post.post_type === 'text'){

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
          shareCommentary: { text: post.postText },
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
        user_id,
        post_type: "text",
        postText: post.postText,
        post_id,
        post_id_urn_number,
      });
    }


      // Update status
      post.post_status = "published";
      post.updated_at = new Date();
      await post.save();

        await ScheduledPosts.findByIdAndDelete(postId);

      done();
    }
      else {
        throw new Error("LinkedIn API returned non-201 response");
      }
    } catch (err) {
      console.error("❌ Error publishing post:", err?.response?.data || err.message);

      // Optional: mark as errored
      await ScheduledPosts.findByIdAndUpdate(job.attrs.data.postId, {
        post_status: "errored",
        updated_at: new Date(),
      });

      return done(err);
    }
  });
};
