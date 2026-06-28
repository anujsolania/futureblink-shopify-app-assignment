import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Use existing model if initialized to prevent error on dev hot-reload
export const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
