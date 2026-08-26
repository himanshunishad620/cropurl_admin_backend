const { Router } = require("express");
const {
  getGlobalDataByCookie,
  createQR,
  fetchAllQr,
  fetchAnalytic,
  fetchQR,
  updateQR,
  deleteQR,
  deleteQRs,
  createQRs,
  deleteAllQrs,
  deleteAccount,
} = require("../controllers/qrController");
const router = Router();

router.get("/getGlobalDataByCookie", getGlobalDataByCookie);
router.post("/createQR", createQR);
router.post("/createQRs", createQRs);
router.get("/fetchAllQr", fetchAllQr);
router.get("/fetchAnalytic/:shortCode", fetchAnalytic);
router.get("/fetchQR/:shortCode", fetchQR);
router.patch("/updateQR/:shortCode", updateQR);
router.delete("/deleteQR/:shortCode", deleteQR);
router.delete("/deleteQRs", deleteQRs);
router.delete("/deleteAllQRs", deleteAllQrs);
router.delete("/deleteAccount", deleteAccount);

module.exports = router;
