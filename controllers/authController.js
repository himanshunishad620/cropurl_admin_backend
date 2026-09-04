// const { generateToken, decodeToken } = require("../helper/jwt");
// const { sendEmail } = require("../helper/resend");
// const Global = require("../models/Global");
// const crypto = require("crypto");
// require("dotenv").config();
// const User = require("../models/User");
// const PasswordReset = require("../models/PasswordReset");
// const bcrypt = require("bcrypt");
// const RegisterVerification = require("../models/RegisterVerification");
// const EmailUpdate = require("../models/EmailUpdate");

// // Generate a verification link for new user registration
// const generateVerificationLink = async (req, res) => {
//   const { email, password, firstName, lastName } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });

//     const existingVerification = await RegisterVerification.findOne({
//       email,
//       expiresAt: { $gt: new Date() },
//     });

//     if (existingVerification)
//       return res.status(409).json({
//         success: false,
//         message: "A verification link has already been generated.",
//       });

//     // Remove previous verification records for this email.
//     await RegisterVerification.deleteMany({
//       email,
//     });

//     if (existingUser)
//       return res.status(409).json({
//         success: false,
//         message: "An account with this email already exists.",
//       });

//     const rawToken = crypto.randomBytes(16).toString("hex");

//     const tokenHash = crypto
//       .createHash("sha256")
//       .update(rawToken)
//       .digest("hex");

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const verificationRecord = await RegisterVerification.create({
//       email,
//       password: hashedPassword,
//       firstName,
//       lastName,
//       tokenHash,
//     });

//     if (!verificationRecord)
//       return res.status(500).json({
//         success: false,
//         message: "Failed to create registration verification record.",
//       });

//     const verificationLink = `${process.env.CLIENT_URL}/verifyEmail/${rawToken}`;

//     return res.status(200).json({
//       success: true,
//       message: "A verification link has been sent to your email address.",
//       verificationLink,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error!",
//     });
//   }
// };

// // Verify the registration token and create the user account
// const verifyAndRegister = async (req, res) => {
//   const { rawToken } = req.body;

//   if (!rawToken) {
//     return res.status(400).json({
//       success: false,
//       message: "The verification link is invalid.",
//     });
//   }

//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(rawToken)
//     .digest("hex");

//   try {
//     const verificationRecord = await RegisterVerification.findOne({
//       tokenHash: hashedToken,
//       expiresAt: { $gt: new Date() },
//     });

//     if (!verificationRecord) {
//       return res.status(400).json({
//         success: false,
//         message: "Verification link has expired.",
//       });
//     }

//     const newUser = await User.create({
//       email: verificationRecord.email,
//       firstName: verificationRecord.firstName,
//       lastName: verificationRecord.lastName,
//       password: verificationRecord.password,
//     });

//     await Global.create({
//       userId: newUser._id,
//     });

//     // Remove the verification record after successful registration.
//     await RegisterVerification.deleteMany({
//       tokenHash: hashedToken,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Account created successfully.",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error!",
//     });
//   }
// };

// // Verify the email update token and update the user's email
// const verifyAndUpdate = async (req, res) => {
//   const { rawToken } = req.body;

//   if (!rawToken) {
//     return res.status(400).json({
//       success: false,
//       message: "The verification link is invalid.",
//     });
//   }

//   const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

//   try {
//     const emailUpdateRequest = await EmailUpdate.findOne({
//       tokenHash,
//       expiresAt: { $gt: new Date() },
//     });

//     if (!emailUpdateRequest) {
//       return res.status(400).json({
//         success: false,
//         message: "The verification link is invalid or has expired.",
//       });
//     }

//     const user = await User.findOne({
//       email: emailUpdateRequest.currEmail,
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     const existingUser = await User.findOne({
//       email: emailUpdateRequest.newEmail,
//       _id: { $ne: user._id },
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: "An account with this email already exists.",
//       });
//     }

//     user.email = emailUpdateRequest.newEmail;

//     await user.save();

//     // Remove the email update request after successful verification.
//     await EmailUpdate.deleteOne({
//       _id: emailUpdateRequest._id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Email address updated successfully.",
//     });
//   } catch (error) {
//     console.error("Email verification error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// // Authenticate the user and create the authentication cookie
// const doLogin = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "Email and password are required",
//     });
//   }

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid email or password",
//       });
//     }

//     const isPasswordMatched = await bcrypt.compare(password, user.password);

//     if (!isPasswordMatched) {
//       return res.status(401).json({
//         message: "Invalid email or password",
//       });
//     }

//     const token = generateToken({ userId: user._id });

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       maxAge: 4 * 24 * 60 * 60 * 1000,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Login successful.",
//       user: {
//         userId: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// // Verify the authentication cookie
// const verifyCookie = async (req, res) => {
//   const { token } = req.cookies;

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication required.",
//     });
//   }

//   const decodedToken = decodeToken(token);

//   if (!decodedToken) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token.",
//     });
//   }

//   try {
//     const user = await User.findById(decodedToken.userId).select(
//       "_id firstName lastName email",
//     );

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Authentication successful.",
//       user: {
//         userId: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// // Fetch the authenticated user's profile
// const getUser = async (req, res) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication required.",
//     });
//   }

//   const decodedToken = decodeToken(token);

//   if (!decodedToken?.userId) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token.",
//     });
//   }

//   try {
//     const user = await User.findById(decodedToken.userId)
//       .select("-password")
//       .lean();

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "User found successfully.",
//       user,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// // Update the authenticated user's profile
// const updateProfile = async (req, res) => {
//   const { token } = req.cookies;
//   const { firstName, lastName, email } = req.body;

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication required.",
//     });
//   }

//   const decodedToken = decodeToken(token);

//   if (!decodedToken?.userId) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token.",
//     });
//   }

//   try {
//     const user = await User.findById(decodedToken.userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     const currentEmail = user.email;

//     user.firstName = firstName;
//     user.lastName = lastName;

//     // Email changes require verification through a separate link.
//     if (currentEmail !== email) {
//       const existingUser = await User.findOne({
//         email,
//         _id: { $ne: user._id },
//       });

//       if (existingUser) {
//         return res.status(409).json({
//           success: false,
//           message: "An account with this email already exists.",
//         });
//       }

//       const existingRequest = await EmailUpdate.findOne({
//         currEmail: currentEmail,
//         expiresAt: {
//           $gt: new Date(),
//         },
//       });

//       if (existingRequest) {
//         return res.status(409).json({
//           success: false,
//           message: "A verification email has already been sent",
//         });
//       }

//       const rawToken = crypto.randomBytes(16).toString("hex");

//       const tokenHash = crypto
//         .createHash("sha256")
//         .update(rawToken)
//         .digest("hex");

//       await EmailUpdate.create({
//         tokenHash,
//         currEmail: currentEmail,
//         newEmail: email,
//       });

//       await user.save();

//       const link = `${process.env.CLIENT_URL}/verifyUpdateEmail/${rawToken}`;

//       return res.status(200).json({
//         success: true,
//         message: "Please verify your new email address.",
//         link,
//       });
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: "Profile updated successfully.",
//       user: {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// // Update the authenticated user's password
// const updatePassword = async (req, res) => {
//   const { password, currentPassword } = req.body;
//   const { token } = req.cookies;

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication required.",
//     });
//   }

//   const decodedToken = decodeToken(token);

//   if (!decodedToken?.userId) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token.",
//     });
//   }

//   if (!currentPassword || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "Current password and new password are required.",
//     });
//   }

//   try {
//     const user = await User.findById(decodedToken.userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     const isPasswordMatched = await bcrypt.compare(
//       currentPassword,
//       user.password,
//     );

//     if (!isPasswordMatched) {
//       return res.status(401).json({
//         success: false,
//         message: "Current password is incorrect.",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     user.password = hashedPassword;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: "Password changed successfully.",
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// // Generate a password reset link
// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({
//       success: false,
//       message: "Email is required.",
//     });
//   }

//   try {
//     const existingResetRequest = await PasswordReset.findOne({
//       email,
//       expiresAt: {
//         $gt: new Date(),
//       },
//     });

//     if (existingResetRequest) {
//       return res.status(409).json({
//         success: false,
//         message: "A password reset link has already been sent.",
//       });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "No account found with this email.",
//       });
//     }

//     const rawToken = crypto.randomBytes(16).toString("hex");

//     const tokenHash = crypto
//       .createHash("sha256")
//       .update(rawToken)
//       .digest("hex");

//     const link = `${process.env.CLIENT_URL}/auth/resetPassword/${rawToken}`;

//     await PasswordReset.create({ email, tokenHash });

//     return res.status(200).json({
//       success: true,
//       message: "Verification email sent successfully.",
//       link,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// // Reset the user's password using the reset token
// const resetPassword = async (req, res) => {
//   const { rawToken, password } = req.body;

//   if (!password) {
//     return res.status(400).json({
//       success: false,
//       message: "New password is required.",
//     });
//   }

//   if (!rawToken) {
//     return res.status(400).json({
//       success: false,
//       message: "Verification link is invalid.",
//     });
//   }

//   const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

//   try {
//     const passwordResetRequest = await PasswordReset.findOne({
//       tokenHash,
//       expiresAt: { $gt: new Date() },
//     });

//     if (!passwordResetRequest) {
//       return res.status(400).json({
//         success: false,
//         message: "Verification link has expired.",
//       });
//     }

//     const { email } = passwordResetRequest;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     user.password = hashedPassword;

//     await user.save();

//     // Remove the reset token after successfully changing the password.
//     await PasswordReset.deleteMany({
//       tokenHash,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Password changed successfully.",
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

// // Clear the authentication cookie and log out the user
// const doLogout = async (req, res) => {
//   try {
//     res.clearCookie("token", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//     });
//     res.status(200).json({
//       success: true,
//       message: "Logged out successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Logout failed",
//     });
//   }
// };

// module.exports = {
//   doLogin,
//   getUser,
//   verifyCookie,
//   generateVerificationLink,
//   verifyAndRegister,
//   updateProfile,
//   verifyAndUpdate,
//   updatePassword,
//   forgotPassword,
//   resetPassword,
//   doLogout,
// };

const { generateToken, decodeToken } = require("../helper/jwt");
const {
  sendRegistrationVerificationLink,
  sendForgotPasswordVerificationLink,
  sendUpdateEmailVerificationLink,
} = require("../helper/resend");
const Global = require("../models/Global");
const crypto = require("crypto");
require("dotenv").config();
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const bcrypt = require("bcrypt");
const RegisterVerification = require("../models/RegisterVerification");
const EmailUpdate = require("../models/EmailUpdate");

// Generate a verification link for new user registration
const generateVerificationLink = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    const existingVerification = await RegisterVerification.findOne({
      email,
      expiresAt: { $gt: new Date() },
    });

    if (existingVerification) {
      return res.status(409).json({
        status: "Conflict",
        message:
          "A verification link has already been generated for this email address.",
      });
    }

    await RegisterVerification.deleteMany({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        status: "Conflict",
        message: "An account with this email address already exists.",
      });
    }

    const rawToken = crypto.randomBytes(16).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationRecord = await RegisterVerification.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      tokenHash,
    });

    if (!verificationRecord) {
      return res.status(500).json({
        status: "Internal Server Error",
        message:
          "Unable to create the registration verification request. Please try again later.",
      });
    }

    const verificationLink = `${process.env.CLIENT_URL}/verifyEmail/${rawToken}`;

    await sendRegistrationVerificationLink(verificationLink, email);

    return res.status(200).json({
      status: "Success",
      message: "Registration verification link generated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message:
        "Unable to generate the registration verification link. Please try again later.",
    });
  }
};

// Verify the registration token and create the user account
const verifyAndRegister = async (req, res) => {
  const { rawToken } = req.body;

  if (!rawToken) {
    return res.status(400).json({
      status: "Bad Request",
      message: "A valid registration verification token is required.",
    });
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  try {
    const verificationRecord = await RegisterVerification.findOne({
      tokenHash: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord) {
      return res.status(400).json({
        status: "Bad Request",
        message:
          "The registration verification link is invalid or has expired.",
      });
    }

    const newUser = await User.create({
      email: verificationRecord.email,
      firstName: verificationRecord.firstName,
      lastName: verificationRecord.lastName,
      password: verificationRecord.password,
    });

    await Global.create({
      userId: newUser._id,
    });

    await RegisterVerification.deleteMany({
      tokenHash: hashedToken,
    });

    return res.status(201).json({
      status: "Created",
      message: "Account created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to create the account. Please try again later.",
    });
  }
};

// Verify the email update token and update the user's email
const verifyAndUpdate = async (req, res) => {
  const { rawToken } = req.body;

  if (!rawToken) {
    return res.status(400).json({
      status: "Bad Request",
      message: "A valid email verification token is required.",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const emailUpdateRequest = await EmailUpdate.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!emailUpdateRequest) {
      return res.status(400).json({
        status: "Bad Request",
        message: "The email verification link is invalid or has expired.",
      });
    }

    const user = await User.findOne({
      email: emailUpdateRequest.currEmail,
    });

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message:
          "The user associated with this email update request could not be found.",
      });
    }

    const existingUser = await User.findOne({
      email: emailUpdateRequest.newEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "Conflict",
        message: "An account with the new email address already exists.",
      });
    }

    user.email = emailUpdateRequest.newEmail;

    await user.save();

    await EmailUpdate.deleteOne({
      _id: emailUpdateRequest._id,
    });

    return res.status(200).json({
      status: "Success",
      message: "Email address updated successfully.",
      newEmail: emailUpdateRequest.newEmail,
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to update the email address. Please try again later.",
    });
  }
};

// Authenticate the user and create the authentication cookie
const doLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "Bad Request",
      message: "Both email address and password are required to log in.",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "Invalid email address or password.",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "Invalid email address or password.",
      });
    }

    const token = generateToken({
      userId: user._id,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 4 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "Success",
      message: "Login successful.",
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to log in. Please try again later.",
    });
  }
};

// Verify the authentication cookie
const verifyCookie = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Authentication is required to access this resource.",
    });
  }

  const decodedToken = decodeToken(token);

  if (!decodedToken) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "The authentication token is invalid or has expired.",
    });
  }

  try {
    const user = await User.findById(decodedToken.userId).select(
      "_id firstName lastName email",
    );

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "The authenticated user account could not be found.",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Authentication verified successfully.",
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message:
        "Unable to verify the authentication session. Please try again later.",
    });
  }
};

// Fetch the authenticated user's profile
const getUser = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Authentication is required to access the user profile.",
    });
  }

  const decodedToken = decodeToken(token);

  if (!decodedToken?.userId) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "The authentication token is invalid or has expired.",
    });
  }

  try {
    const user = await User.findById(decodedToken.userId)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "The authenticated user account could not be found.",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "User profile retrieved successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to retrieve the user profile. Please try again later.",
    });
  }
};

// Update the authenticated user's profile
const updateProfile = async (req, res) => {
  const { token } = req.cookies;
  const { firstName, lastName, email } = req.body;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Authentication is required to update the user profile.",
    });
  }

  const decodedToken = decodeToken(token);

  if (!decodedToken?.userId) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "The authentication token is invalid or has expired.",
    });
  }

  try {
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "The user account could not be found.",
      });
    }

    const currentEmail = user.email;

    user.firstName = firstName;
    user.lastName = lastName;

    if (currentEmail !== email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          status: "Conflict",
          message: "An account with this email address already exists.",
        });
      }

      const existingRequest = await EmailUpdate.findOne({
        currEmail: currentEmail,
        expiresAt: {
          $gt: new Date(),
        },
      });

      if (existingRequest) {
        return res.status(409).json({
          status: "Conflict",
          message:
            "An email update verification request has already been generated.",
        });
      }

      const rawToken = crypto.randomBytes(16).toString("hex");

      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await EmailUpdate.create({
        tokenHash,
        currEmail: currentEmail,
        newEmail: email,
      });

      await user.save();

      const verificationLink = `${process.env.CLIENT_URL}/verifyUpdateEmail/${rawToken}`;
      await sendUpdateEmailVerificationLink(verificationLink);
      return res.status(200).json({
        status: "Success",
        message:
          "Profile details updated successfully. Please verify your new email address to complete the email update.",
      });
    }

    await user.save();

    return res.status(200).json({
      status: "Success",
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to update the user profile. Please try again later.",
    });
  }
};

// Update the authenticated user's password
const updatePassword = async (req, res) => {
  const { password, currentPassword } = req.body;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Authentication is required to change the password.",
    });
  }

  const decodedToken = decodeToken(token);

  if (!decodedToken?.userId) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "The authentication token is invalid or has expired.",
    });
  }

  if (!currentPassword || !password) {
    return res.status(400).json({
      status: "Bad Request",
      message: "Both the current password and the new password are required.",
    });
  }

  try {
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "The user account could not be found.",
      });
    }

    const isPasswordMatched = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordMatched) {
      return res.status(400).json({
        status: "Bad Request",
        message: "The current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      status: "Success",
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to change the password. Please try again later.",
    });
  }
};

// Generate a password reset link
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: "Bad Request",
      message: "An email address is required to reset the password.",
    });
  }

  try {
    const existingResetRequest = await PasswordReset.findOne({
      email,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (existingResetRequest) {
      return res.status(409).json({
        status: "Conflict",
        message:
          "A password reset request has already been generated for this email address.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "No user account was found with this email address.",
      });
    }

    const rawToken = crypto.randomBytes(16).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const verificationLink = `${process.env.CLIENT_URL}/resetPassword/${rawToken}`;
    await sendForgotPasswordVerificationLink(verificationLink, email);

    await PasswordReset.create({
      email,
      tokenHash,
    });

    return res.status(200).json({
      status: "Success",
      message: "Password reset verification link generated successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "Internal Server Error",
      message:
        "Unable to generate the password reset link. Please try again later.",
    });
  }
};

// Reset the user's password using the reset token
const resetPassword = async (req, res) => {
  const { rawToken, password } = req.body;

  if (!password) {
    return res.status(400).json({
      status: "Bad Request",
      message: "A new password is required to reset the password.",
    });
  }

  if (!rawToken) {
    return res.status(400).json({
      status: "Bad Request",
      message: "A valid password reset verification token is required.",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const passwordResetRequest = await PasswordReset.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordResetRequest) {
      return res.status(400).json({
        status: "Bad Request",
        message:
          "The password reset verification link is invalid or has expired.",
      });
    }

    const { email } = passwordResetRequest;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message:
          "The user account associated with this password reset request could not be found.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    await user.save();

    await PasswordReset.deleteMany({
      tokenHash,
    });

    return res.status(200).json({
      status: "Success",
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to reset the password. Please try again later.",
    });
  }
};

// Clear the authentication cookie and log out the user
const doLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      status: "Success",
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to log out. Please try again later.",
    });
  }
};

module.exports = {
  doLogin,
  getUser,
  verifyCookie,
  generateVerificationLink,
  verifyAndRegister,
  updateProfile,
  verifyAndUpdate,
  updatePassword,
  forgotPassword,
  resetPassword,
  doLogout,
};
