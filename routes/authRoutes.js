const { Router } = require("express");
const {
  generateVerificationLink,
  verifyAndRegister,
  doLogin,
  verifyCookie,
  getUser,
  updateProfile,
  verifyAndUpdate,
  updatePassword,
  forgotPassword,
  resetPassword,
  doLogout,
} = require("./../controllers/authController");

const router = Router();

router.post("/generateVerificationLink", generateVerificationLink);
router.post("/verifyLink", verifyAndRegister);
router.post("/login", doLogin);
router.get("/verifyToken", verifyCookie);
router.get("/getUserProfile", getUser);
router.patch("/updateProfile", updateProfile);
router.patch("/updateEmail", verifyAndUpdate);
router.patch("/updatePassword", updatePassword);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);
router.get("/logout", doLogout);

module.exports = router;
