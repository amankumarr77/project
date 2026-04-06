const mongoose = require('mongoose');
const { union, number } = require('zod');
const Schema = mongoose.Schema;
const objectId = Schema.ObjectId;


const userSchema = new Schema({
    name: {type:String ,unique:true},
    points: Number,
    friends:[{type:objectId}],
    email: { type: String, unique: true },
    password: String,
})

const cfSchema = new Schema({
    userId: { type: objectId, unique: true },
    cf_points: Number,
    cf_url: String,
    cf_questionNo: Number,
    cf_contest: Number,
    cf_maxrating: Number,
    cf_currentrating: Number
})

const ccSchema = new Schema({
    userId: { type: objectId, unique: true },
    cc_points: Number,
    cc_url: String,
    cc_questionNo: Number,
    cc_contest: Number,
    cc_maxrating: Number,
    cc_currentrating: Number
})

const lcSchema = new Schema({
    userId: { type: objectId, unique: true },
    lc_points: Number,
    lc_url: String,
    lc_contest: Number,
    lc_maxrating: Number,
    lc_questionNo: Number,
    lc_currentrating: Number
})



const userModel = mongoose.model("user", userSchema);
const cfModel = mongoose.model("cf", cfSchema);
const ccModel = mongoose.model("cc", ccSchema);
const lcModel = mongoose.model("lc", lcSchema);



module.exports = {
    userModel: userModel,
    cfModel: cfModel,
    ccModel: ccModel,
    lcModel: lcModel
}


