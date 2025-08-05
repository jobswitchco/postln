import mongoose from 'mongoose';
const { Schema } = mongoose;


const PublishedPosts_Schema = new Schema({

    user_id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "users",
         },

         postText: String,
         media_url: String,
          published_at: {
           type: Date
          },

       post_type: String,

       post_id: String,
       post_id_urn_number: Number,

    is_del: {
        type: Boolean,
        default: false
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    updated_at: {
        type: Date
    }
});


const PublishedPosts_Schema_Model = mongoose.model('published_posts', PublishedPosts_Schema);
export default PublishedPosts_Schema_Model;
