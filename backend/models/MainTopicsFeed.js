import mongoose from 'mongoose';
const { Schema } = mongoose;


const MainTopics_Schema = new Schema({

   keyword: {
    type: String,
    required: true,
    index: true, // Index for faster queries
  },
  region: {
    type: String, // "IN", "US", "UK", etc.
    required: true,
    index: true,
  },
  title: String,
  url: String,
  summary: String,
  sources: [{ type: String}],
  publishedAt: Date,
  language: String,
  fetchedAt: {
    type: Date,
    default: Date.now,
  },

});


const MainTopicsFeed_Schema_Model = mongoose.model('main_topics_feed', MainTopics_Schema);
export default MainTopicsFeed_Schema_Model;
