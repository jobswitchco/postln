import mongoose from 'mongoose';
const { Schema } = mongoose;


const PlanDetails_Schema = new Schema({


    name: {
        type: String,
    },

    invitations_per_month: {
        type: Number
    },

     price_month_monthly: {
        type: Number
    },

     price_month_yearly: {
        type: Number
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


const PlanDetails_Schema_Model = mongoose.model('plan_details', PlanDetails_Schema);
export default PlanDetails_Schema_Model;
