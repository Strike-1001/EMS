import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    match: /.+\@.+\..+/
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema); 