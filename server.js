const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

mongoose.connect("mongodb://0.0.0.0:27017/Chat-WebApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dataSchema = new mongoose.Schema({
  temperature: Number,
  batteryLevel: Number,
  timeStamp: String,
});

const Data = mongoose.model("Data", dataSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory

// Route for latestRecords.html for fetching record according to start date and end date.
app.get("/fetch-records", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "fetchRecords.html"));
});

// Route for index.html for for showing all the records in the real-time.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/saveData", async (req, res) => {
  try {
    const { temperature, batteryLevel, timeStamp } = req.body;
    const newData = new Data({ temperature, batteryLevel, timeStamp });
    await newData.save();
    io.emit("newData", newData); // Emit new data to connected clients
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.get("/api/fetchHistoricalData", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const historicalData = await Data.find({
      timeStamp: { $gte: startDate, $lte: endDate },
    });

    if (historicalData.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No historical data found" });
    }

    res.status(200).json({ success: true, data: historicalData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
