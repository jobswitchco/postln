import mongoose from 'mongoose';
const { Schema } = mongoose;

const MainTopics_Schema = new Schema({
  keyword: {
    type: String,
    required: true,
    index: true, // still fine to have single index for other queries
  },
  region: {
    type: String, // "IN", "US", "UK", etc.
    required: true,
    index: true,
  },
  title: {
    type: String,
    index: true // optional: helps distinct() & duplicate checks
  },
  url: String,
  isCleaned: { type: Boolean, default: false},
  summary: String,
  sources: [{ type: String }],
  publishedAt: Date,
  language: String,
  image: String,
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true // helps filtering today's articles
  },
});

// Compound index for your common query pattern
// Matches: keyword + region + fetchedAt (and includes title for duplicate check)
MainTopics_Schema.index(
  { keyword: 1, region: 1, fetchedAt: 1, title: 1 }
);

const MainTopicsFeed_Schema_Model = mongoose.model(
  'main_topics_feed',
  MainTopics_Schema
);

export default MainTopicsFeed_Schema_Model;
