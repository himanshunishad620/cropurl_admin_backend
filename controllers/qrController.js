require("dotenv").config();
const {
  getDataByDays,
  getGraphDataByDays,
  getTopNData,
  totalActionIsLastNDays,
} = require("../helper/dataCleaner");
const { decodeToken } = require("../helper/jwt");
const Global = require("../models/Global");
const QRAnalytics = require("../models/QRAnalytics");
const QRCode = require("../models/QRCode");
const User = require("../models/User");
const FirstShortUrl = require("../models/FirstShortUrl");

// Get global analytics
const getGlobalDataByCookie = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized access!",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized access!",
      });
    }

    const data = await Global.findOne({ userId }, { _id: 0 }).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        msg: "Global data not found!",
      });
    }
    const result = {
      totalScans: data.totalScans,
      totalClicks: data.totalClicks,
      uniqueVisitors: data.uniqueVisitors,

      uniqueVisitorsRate: Math.round(
        (data.uniqueVisitors / (data.totalClicks + data.totalScans)) * 100,
      ),

      totalClicksInLast30Days: totalActionIsLastNDays("clicks", data.daily, 30),

      totalScansInLast30Days: totalActionIsLastNDays("scans", data.daily, 30),

      last1Days: getDataByDays(data.daily, 1),
      last7Days: getDataByDays(data.daily, 7),
      last30Days: getDataByDays(data.daily, 30),

      graphData: [
        getGraphDataByDays(data.daily, 7),
        getGraphDataByDays(data.daily, 30),
        getGraphDataByDays(data.daily, 90),
      ],

      topNBrowsers: getTopNData(data.browser, 3),
      topNCities: getTopNData(data.cities, 3),
    };

    return res.status(200).json({
      success: true,
      msg: "Data Found!",
      result,
    });
  } catch (error) {
    console.error("Get global data error:", error);

    return res.status(500).json({
      success: false,
      msg: "Unable to fetch global data!",
    });
  }
};

// Create single QR
const createQR = async (req, res) => {
  const { name, destinationUrl, imgUrl, shortCode } = req.body;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized user",
    });
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized user",
      });
    }

    const { userId } = decoded;

    const [result] = await Promise.all([
      QRCode.create({
        userId,
        name,
        destinationUrl,
        shortCode,
        imgUrl,
      }),

      QRAnalytics.create({
        shortCode,
        userId,
      }),
    ]);

    return res.status(201).json({
      success: true,
      msg: "QR created successfully",
      result,
    });
  } catch (error) {
    console.error("Create QR error:", error);

    return res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
};

// Create multiple QRs
const createQRs = async (req, res) => {
  const { qr } = req.body;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized user",
    });
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized user",
      });
    }

    if (!Array.isArray(qr) || !qr.length) {
      return res.status(400).json({
        success: false,
        msg: "QR data is required",
      });
    }

    const { userId } = decoded;

    const qrData = qr.map((row) => ({
      ...row,
      userId,
    }));

    const analyticData = qr.map((row) => ({
      userId,
      shortCode: row.shortCode,
    }));

    await Promise.all([
      QRCode.insertMany(qrData),
      QRAnalytics.insertMany(analyticData),
    ]);

    return res.status(201).json({
      success: true,
      msg: "QRs created successfully",
    });
  } catch (error) {
    console.error("Create QRs error:", error);

    return res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
};

// Fetch QR analytics
const fetchAnalytic = async (req, res) => {
  const { shortCode } = req.params;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Token not found!",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "User not found!",
      });
    }

    const data = await QRAnalytics.findOne({
      shortCode,
      userId,
    }).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        msg: "Data Not Found",
      });
    }

    const totalActions = data.totalClicks + data.totalScans;

    const result = {
      totalScans: data.totalScans,
      totalClicks: data.totalClicks,
      uniqueClicks: data.uniqueClicks,

      uniqueClicksRate: totalActions
        ? Math.round((data.uniqueClicks / totalActions) * 100)
        : 0,

      totalClicksInLast30Days: totalActionIsLastNDays("clicks", data.daily, 30),

      totalScansInLast30Days: totalActionIsLastNDays("scans", data.daily, 30),

      topNBrowsers: getTopNData(data.browser, 3),
      topNCities: getTopNData(data.cities, 3),
    };

    return res.status(200).json({
      success: true,
      msg: "Data found",
      data: result,
    });
  } catch (error) {
    console.error("Fetch analytics error:", error);

    return res.status(500).json({
      success: false,
      msg: "Unable to fetch analytics!",
    });
  }
};

// Fetch all QRs
const fetchAllQr = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Cookie not found!",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "User not found!",
      });
    }

    const { page = 1, status = "All", search, order, limit = 10 } = req.query;

    const sort = order === "Oldest" ? 1 : -1;

    const filter = { userId };

    if (status !== "All") {
      filter.isActive = status === "Active";
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    const pageLimit = Number(limit) || 10;
    let pageNo = Number(page) || 1;

    const counts = await QRCode.countDocuments(filter);

    const totalPages = Math.ceil(counts / pageLimit);

    pageNo = pageNo > totalPages ? 1 : pageNo;

    const skip = (pageNo - 1) * pageLimit;

    const data = await QRCode.find(filter)
      .sort({ createdAt: sort })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    return res.status(200).json({
      success: true,
      msg: "Data found",
      data: {
        arr: data,
        currCount: data.length,
        total: counts,
        pageNo,
        totalPages,
        limit: pageLimit,
        hasNextPage: pageNo < totalPages,
        hasPreviousPage: pageNo > 1,
      },
    });
  } catch (error) {
    console.error("Fetch all QR error:", error);

    return res.status(500).json({
      success: false,
      msg: "Unable to fetch QR codes!",
    });
  }
};

// Fetch single QR
const fetchQR = async (req, res) => {
  const { shortCode } = req.params;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    if (!shortCode || typeof shortCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "QR code is required.",
      });
    }

    const data = await QRCode.findOne({
      shortCode: shortCode.trim(),
      userId: decoded.userId,
    }).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "QR code not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "QR code fetched successfully.",
      data,
    });
  } catch (error) {
    console.error("Fetch QR error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch QR code. Please try again later.",
    });
  }
};

// Update QR
const updateQR = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const { shortCode } = req.params;
    const { status, destinationUrl, name } = req.body;

    if (!shortCode) {
      return res.status(400).json({
        success: false,
        message: "QR code is required.",
      });
    }

    if (typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false.",
      });
    }

    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid QR name.",
      });
    }

    if (typeof destinationUrl !== "string" || !destinationUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Destination URL is required.",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(destinationUrl.trim());
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid destination URL.",
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Only HTTP and HTTPS URLs are allowed.",
      });
    }

    const data = await QRCode.findOneAndUpdate(
      {
        shortCode,
        userId,
      },
      {
        $set: {
          isActive: status,
          name: name.trim(),
          destinationUrl: destinationUrl.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "QR code not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "QR updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update QR error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update QR code. Please try again later.",
    });
  }
};

// Delete single QR
const deleteQR = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const { shortCode } = req.params;

    if (!shortCode || typeof shortCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code.",
      });
    }

    const filter = {
      userId,
      shortCode: shortCode.trim(),
    };

    await Promise.all([
      QRCode.deleteOne(filter),
      QRAnalytics.deleteOne(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "QR code deleted successfully.",
    });
  } catch (error) {
    console.error("Delete QR error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete QR code. Please try again later.",
    });
  }
};

// Delete multiple QRs
const deleteQRs = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const { shortCodes } = req.body;

    if (!Array.isArray(shortCodes) || shortCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one QR code.",
      });
    }

    const validShortCodes = shortCodes.filter(
      (code) => typeof code === "string" && code.trim().length > 0,
    );

    if (validShortCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid short codes.",
      });
    }

    const filter = {
      userId,
      shortCode: { $in: validShortCodes },
    };

    const [qrResult, analyticsResult] = await Promise.all([
      QRCode.deleteMany(filter),
      QRAnalytics.deleteMany(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "QR codes deleted successfully.",
      data: {
        deletedQrs: qrResult.deletedCount,
        deletedAnalytics: analyticsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete QRs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete QR codes. Please try again later.",
    });
  }
};

// Delete all QRs
const deleteAllQrs = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const [qrResult, analyticsResult] = await Promise.all([
      QRCode.deleteMany({ userId }),
      QRAnalytics.deleteMany({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "All QR codes deleted successfully.",
      data: {
        deletedQrs: qrResult.deletedCount,
        deletedAnalytics: analyticsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete all QRs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete QR codes. Please try again later.",
    });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "User not found!",
      });
    }

    await Promise.all([
      QRCode.deleteMany({ userId }),
      QRAnalytics.deleteMany({ userId }),
      Global.deleteOne({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      msg: "Deleted",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
};

//Create Only Short URL
const createShortURL = async (req, res) => {
  const { destinationUrl, shortCode } = req.body;

  if (!destinationUrl || !shortCode) {
    return res.status(400).json({
      success: false,
      message: "Destination URL and short code are required.",
    });
  }

  try {
    const shortUrlData = await FirstShortUrl.create({
      destinationUrl,
      shortCode,
    });

    const shortUrl = `${process.env.CLICK_URL}/${shortUrlData.shortCode}`;

    return res.status(201).json({
      success: true,
      shortUrl,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

module.exports = {
  fetchQR,
  fetchAnalytic,
  getGlobalDataByCookie,
  createQR,
  createQRs,
  fetchAllQr,
  updateQR,
  deleteQR,
  deleteQRs,
  deleteAllQrs,
  deleteAccount,
  createShortURL,
};
