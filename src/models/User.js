import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic authentication fields
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
  contact: {
    type: String,
    required: function() { return this.role === "user"; }
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  // Employee-specific fields (when role = "user")
  employeeId: {
    type: String,
    unique: true,
    sparse: true // Allows null values for non-employees
  },
  firstName: {
    type: String,
    required: function() { return this.role === "user"; }
  },
  lastName: {
    type: String,
    required: function() { return this.role === "user"; }
  },
  phone: {
    type: String,
    required: function() { return this.role === "user"; }
  },
  department: {
    type: String,
    required: function() { return this.role === "user"; }
  },
  position: {
    type: String,
    required: function() { return this.role === "user"; }
  },
  hireDate: {
    type: Date,
    required: function() { return this.role === "user"; }
  },
  salary: {
    type: Number,
    required: function() { return this.role === "user"; }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  profilePicture: String
}, { timestamps: true });

export default mongoose.model("User", userSchema);