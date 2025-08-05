import mongoose from 'mongoose';
const { Schema } = mongoose;


const Category_Schema = new Schema({


    category: {
        type: String,
    },

     topics: [{
        type: String,
    }],


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


const Category_Schema_Model = mongoose.model('categories', Category_Schema);
export default Category_Schema_Model;
