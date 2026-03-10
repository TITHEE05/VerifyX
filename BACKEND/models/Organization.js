const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  orgName:     { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  website:     { type: String, default: "" },
  industry:    { type: String, default: "" },
  description: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Organization", organizationSchema);