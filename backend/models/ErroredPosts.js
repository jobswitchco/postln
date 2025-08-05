import mongoose from 'mongoose';
const { Schema } = mongoose;


const ErroredPosts_Schema = new Schema({

    user_id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "users",
         },

       postText: String,
       media_url: String,
       publish_at: {
        type: Date
       },

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


const ErroredPosts_Schema_Model = mongoose.model('errored_posts', ErroredPosts_Schema);
export default ErroredPosts_Schema_Model;
