const Global = require("../models/Global");
const QRCode = require("../models/QRCode");
const Visitor = require("../models/Visitor");
const UAParser = require("ua-parser-js");
const methodKey = {
  c: "totalClicks",
  q: "totalScans",
};
const objKey = {
  c: "clicks",
  q: "scans",
};
const linkClick = async (req, res) => {
  //   const { method, shortCode } = req.params;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;
  const parser = new UAParser(req.headers["user-agent"]);
  const browser = parser.getBrowser().name;
  //   const visitorId = req.cookies.visitorId;
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    console.log(response);
    const location = await response.json();
    const city = location.city;
    console.log(ip, city, browser);
    res.status(200).json({ ip, browser, city });
    // const qr = await QRCode.findOne({ shortCode });
    // if (!qr)
    //   return res.status(404).json({ status: false, message: "QR not found" });

    // let visitor = !visitorId
    //   ? await Visitor.create({ shortCodes: [] })
    //   : await Visitor.findById(visitorId);
    // const isRepeatedClick = visitor.shortCodes.includes(shortCode);
    // const today = new Date().toISOString().split("T")[0];
    // await Global.findOneAndUpdate(
    //   { userId: qr.userId },
    //   {
    //     $inc: {
    //       uniqueVisitors: visitorId ? 0 : 1,
    //       [methodKey[method]]: 1,
    //       [`daily.${today}.${objKey[method]}`]: 1,
    //     },
    //   },
    // );
    // res.cookie("visitorId", visitor._id.toString(), {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "lax",
    //   maxAge: 5 * 365 * 24 * 60 * 60 * 1000,
    // });
    // return res.status(200).json({ success: true, message: "Working" });
  } catch (error) {
    console.log(error);
    // return res
    //   .status(500)
    //   .json({ success: true, message: "Internal Server Error" });
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};
module.exports = { linkClick };
