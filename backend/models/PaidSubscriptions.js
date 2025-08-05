import mongoose from 'mongoose';
const { Schema } = mongoose;


const PaidSubscriptions_Schema = new Schema({


      plan_id: {
                   type: mongoose.Schema.Types.ObjectId,
                   ref: "plan_details",
                 },

    employer: {
                   type: mongoose.Schema.Types.ObjectId,
                   ref: "employer",
                 },

    monthly_plan: {
        type: Boolean,
    },

     plan_starts_at: {
        type: Date,
        default: Date.now
    },


     plan_ends_at: {
        type: Date,
    },

    
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


const PaidSubscriptions_Schema_Model = mongoose.model('paid_subscriptions', PaidSubscriptions_Schema);
export default PaidSubscriptions_Schema_Model;
