import mongoose from 'mongoose';
const { Schema } = mongoose;


const DraftPosts_Schema = new Schema({

    user_id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "users",
         },

       postText: String,
       media_url: String,
       post_type: String,

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


const DraftPosts_Schema_Model = mongoose.model('draft_posts', DraftPosts_Schema);
export default DraftPosts_Schema_Model;
