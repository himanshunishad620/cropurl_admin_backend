const Global = require("../models/Global");
const QRAnalytics = require("../models/QRAnalytics");
const QRCode = require("../models/QRCode");
const Visitor = require("../models/Visitor");
const UAParser = require("ua-parser-js");

const totalActions = {
  c: "totalClicks",
  q: "totalScans",
};

const actions = {
  c: "clicks",
  q: "scans",
};

const linkClick = async (req, res) => {
  const { actionType, shortCode } = req.params;
  const visitorCookieId = req.cookies.visitorId;

  try {
    const qrCode = await QRCode.findOne({
      shortCode,
      isActive: true,
    }).lean();

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }

    let visitorData;

    if (visitorCookieId) {
      visitorData = await Visitor.findById(visitorCookieId).lean();
    }

    const isNewVisitor = !visitorData;

    if (isNewVisitor) {
      visitorData = await Visitor.create({
        shortCodes: [],
      });
    }

    const hasVisitedBefore = visitorData.shortCodes.includes(shortCode);

    const userAgentParser = new UAParser(req.headers["user-agent"]);
    const browserName = userAgentParser.getBrowser().name || "Unknown";

    // const clientIp =
    //   req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    //   req.socket.remoteAddress;

    let cityName = "Unknown";

    // try {
    //   const locationResponse = await fetch(
    //     `https://ip-geolocation21.p.rapidapi.com/backend/ipinfo/?ip=${clientIp}`,
    //     {
    //       method: "GET",
    //       headers: {
    //         "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    //         "x-rapidapi-host": "ip-geolocation21.p.rapidapi.com",
    //       },
    //     },
    //   );
    //
    //   if (locationResponse.ok) {
    //     const locationData = await locationResponse.json();
    //     cityName = locationData.city || "Unknown";
    //   }
    // } catch (error) {
    //   console.error("Geolocation error:", error);
    // }

    const currentDate = new Date().toISOString().split("T")[0];

    const globalAnalyticsUpdate = {
      $inc: {
        [totalActions[actionType]]: 1,
        [`daily.${currentDate}.${actions[actionType]}`]: 1,
        [`browser.${browserName}`]: 1,
        [`cities.${cityName}`]: 1,
        uniqueVisitors: isNewVisitor ? 1 : 0,
      },
    };

    const qrAnalyticsUpdate = {
      $inc: {
        [totalActions[actionType]]: 1,
        [`daily.${currentDate}.${actions[actionType]}`]: 1,
        [`browser.${browserName}`]: 1,
        [`cities.${cityName}`]: 1,
        uniqueVisitors: hasVisitedBefore ? 0 : 1,
      },
    };

    const updateOperations = [
      Global.findOneAndUpdate({ userId: qrCode.userId }, globalAnalyticsUpdate),

      QRAnalytics.findOneAndUpdate({ shortCode }, qrAnalyticsUpdate),
    ];

    if (!hasVisitedBefore) {
      updateOperations.push(
        Visitor.updateOne(
          { _id: visitorData._id },
          {
            $push: {
              shortCodes: shortCode,
            },
          },
        ),
      );
    }

    await Promise.all(updateOperations);

    if (isNewVisitor) {
      res.cookie("visitorId", visitorData._id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 365 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Working",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { linkClick };
