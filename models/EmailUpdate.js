const mongoose = require("mongoose");
const emailUpdateSchema = new mongoose.Schema({
  currEmail: {
    type: String,
    required: true,
    lowerCase: true,
    unique: true,
    trim: true,
  },
  newEmail: {
    type: String,
    required: true,
    lowerCase: true,
    unique: true,
    trim: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
    expires: 0,
  },
});
const EmailUpdate = mongoose.model("EmailUpdate", emailUpdateSchema);
module.exports = EmailUpdate;
