const Global = require("../models/Global");
const QRAnalytics = require("../models/QRAnalytics");
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

const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": "a3b112e753msh12c925143cfbee8p1cf487jsn0bc7765b17b9",
    "x-rapidapi-host": "ip-geolocation21.p.rapidapi.com",
    "Content-Type": "application/json",
  },
};

const linkClick = async (req, res) => {
  const { method, shortCode } = req.params;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;
  const url = `https://ip-geolocation21.p.rapidapi.com/backend/ipinfo/?ip=${ip}`;

  const parser = new UAParser(req.headers["user-agent"]);
  const browser = parser.getBrowser().name;
  const visitorId = req.cookies.visitorId;
  try {
    const qr = await QRCode.findOne({ shortCode });
    if (!qr || !qr.isActive)
      return res.status(404).json({ status: false, message: "QR not found" });
    const response = await fetch(url, options);
    const result = await response.json();
    const city = result.city || "Anonymus";
    console.log(ip, city, browser);
    let visitor = !visitorId
      ? await Visitor.create({ shortCodes: [] })
      : await Visitor.findById(visitorId);
    const isRepeatedClick = visitor.shortCodes.includes(shortCode);
    const today = new Date().toISOString().split("T")[0];
    await Global.findOneAndUpdate(
      { userId: qr.userId },
      {
        $inc: {
          uniqueVisitors: visitorId ? 0 : 1,
          [methodKey[method]]: 1,
          [`daily.${today}.${objKey[method]}`]: 1,
          [`browser.${browser}`]: 1,
          [`cities.${city}`]: 1,
        },
      },
    );
    await QRAnalytics.findOneAndUpdate(
      { shortCode: qr.shortCode },
      {
        $inc: {
          uniqueClicks: isRepeatedClick ? 0 : 1,
          [methodKey[method]]: 1,
          [`daily.${today}.${objKey[method]}`]: 1,
          [`browser.${browser}`]: 1,
          [`cities.${city}`]: 1,
        },
      },
    );
    if (!isRepeatedClick) {
      visitor.shortCodes.push(shortCode);
      await visitor.save();
    }
    res.cookie("visitorId", visitor._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 365 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ success: true, message: "Working" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};
module.exports = { linkClick };
