const mongoose = require("mongoose");

const registerVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    tokenHash: {
      type: String,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 60 * 1000),
      expires: 0,
    },
  },
  {
    timestamps: true,
  },
);

const RegisterVerification = mongoose.model(
  "RegisterVerification",
  registerVerificationSchema,
);

module.exports = RegisterVerification;
