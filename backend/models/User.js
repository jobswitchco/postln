import mongoose from "mongoose";
const { Schema } = mongoose;

const User_Schema = new Schema({
  email: {
    type: String,
    required: true,
  },

  name: {
    type: String,
  },

  sub: {
    type: String,
  },

  credits_left: {
    type: Number,
    default: 50,
  },

  picture: {
    type: String,
  },

  account_delete_code: { type: Number },

  last_login: {
    type: Date,
  },

  loginHistory: [
    {
      type: Date,
    },
  ],

  linkedinUrl: {
    type: String,
    default: "",
  },

  free_trial: {
    type: Boolean,
    default: true,
  },

  free_trial_started_date: {
    type: Date,
  },

  access_token: {
    type: String,
  },

  accessToken_expires_in: {
    type: Number,
  },

  profile_added: {
    type: Boolean,
    default: false,
  },

  model_training_started: {
    type: Boolean,
    default: false,
  },

  model_training_finished: {
    type: Boolean,
    default: false,
  },

  fine_tuned_model: {
    type: String,
  },

  fine_tune_id: {
    type: String,
  },

  posts_analyzed: {
    type: Boolean,
    default: false,
  },

  model_start_time: {
    type: Date,
  },

  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
    },
  ],

  topics: [],

  // ✅ New field for style profile
  style_profile: {
    topEmojis: { type: [String], default: [] },
    topBullets: { type: [String], default: [] },
    preferredNumbering: { type: String, default: "plain-digits" }, // 'bold-digits' | 'plain-digits' | 'none'
    useBoldUnicodeHeaders: { type: Boolean, default: false },
    maxEmojisPer100: { type: Number, default: 0 },
    updatedAt: { type: Date },
  },

  is_del: {
    type: Boolean,
    default: false,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  updated_at: {
    type: Date,
  },
});

const User_Schema_Model = mongoose.model("users", User_Schema);
export default User_Schema_Model;
