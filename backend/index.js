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

// TEST ROUTE (IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend is running");
});

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error(err);
  }
}

main();