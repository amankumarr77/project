const express=require('express');
const app=express();
require("dotenv").config();
const mongoose=require('mongoose');
const cors = require('cors');
app.use(cors({'http://localhost:5173': true}));


const {userRouter}=require("./routes/user");
const {urlRouter}=require("./routes/url");


app.use(express.json());
app.use("/user",userRouter);
app.use("/url",urlRouter);

async function main() {
    await mongoose.connect(process.env.MONGO_URL);
    app.listen(process.env.PORT);
}

main();
