import mongoose from 'mongoose';

const username = 'adminbhaskar';
const password = process.env.MONGODB_PASSWORD;


var dbUrl = 'mongodb+srv://'+username+':'+password+'@atlascluster.kz10ypn.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster';
const connectToMongo = ()=>{
    mongoose.connect(dbUrl).then()
    .catch((err) => { console.error(err); });
}

export default connectToMongo;