import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: Number // duration in hours
});

export default mongoose.model("Course", courseSchema);
