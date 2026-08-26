const mongoose = require("mongoose");
const resetPasswordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowerCase: true,
    trim: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
    expires: 0,
  },
});
const ResetPassword = mongoose.model("ResetPassword", resetPasswordSchema);
module.exports = ResetPassword;
