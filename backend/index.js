const express = require('express');
const app = express();
require("dotenv").config();
const mongoose = require('mongoose');
const cors = require('cors');

app.use(cors({
  origin: "*"
}));

const { userRouter } = require("./routes/user");
const { urlRouter } = require("./routes/url");

app.use(express.json());
app.use("/user", userRouter);
app.use("/url", urlRouter);

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  app.listen(process.env.PORT || 5000, () => {
    console.log("Server running");
  });
}

main();