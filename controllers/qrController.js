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
      status: "Unauthorized",
      message: "Authentication is required to access global analytics data.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "Authentication is required to access global analytics data.",
      });
    }

    const data = await Global.findOne({ userId }, { _id: 0 }).lean();

    if (!data) {
      return res.status(404).json({
        status: "Not Found",
        message: "Global analytics data could not be found.",
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
      status: "Success",
      message: "Global analytics data fetched successfully.",
      result,
    });
  } catch (error) {
    console.error("Get global data error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to fetch global analytics data. Please try again later.",
    });
  }
};

// Create single QR
const createQR = async (req, res) => {
  const { name, destinationUrl, imgUrl, shortCode } = req.body;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
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
      status: "Created",
      message: "QR code created successfully.",
      result,
    });
  } catch (error) {
    console.error("Create QR error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to create the QR code. Please try again later.",
    });
  }
};

// Create multiple QRs
const createQRs = async (req, res) => {
  const { qr } = req.body;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
      });
    }

    if (!Array.isArray(qr) || !qr.length) {
      return res.status(400).json({
        status: "Bad Request",
        message: "QR data is required to create multiple QR codes.",
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
      status: "Created",
      message: "QR codes created successfully.",
    });
  } catch (error) {
    console.error("Create QRs error:", error);
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to create the QR codes. Please try again later.",
    });
  }
};

// Fetch QR analytics
const fetchAnalytic = async (req, res) => {
  const { shortCode } = req.params;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
      });
    }

    const data = await QRAnalytics.findOne({
      shortCode,
      userId,
    }).lean();

    if (!data) {
      return res.status(404).json({
        status: "Not Found",
        message: "Analytics data for the requested QR code could not be found.",
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
      status: "Success",
      message: "QR analytics data fetched successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Fetch analytics error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to fetch QR analytics. Please try again later.",
    });
  }
};

// Fetch all QRs
const fetchAllQr = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
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
      status: "Success",
      message: "QR codes fetched successfully.",
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
      status: "Internal Server Error",
      message: "Unable to fetch QR codes. Please try again later.",
    });
  }
};

// Fetch single QR
const fetchQR = async (req, res) => {
  const { shortCode } = req.params;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
      });
    }

    if (!shortCode || typeof shortCode !== "string") {
      return res.status(400).json({
        status: "Bad Request",
        message: "A QR code is required to update the QR details.",
      });
    }

    const data = await QRCode.findOne({
      shortCode: shortCode.trim(),
      userId: decoded.userId,
    }).lean();

    if (!data) {
      return res.status(404).json({
        status: "Not Found",
        message: "The requested QR code could not be found.",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "QR code fetched successfully.",
      data,
    });
  } catch (error) {
    console.error("Fetch QR error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to fetch the QR code. Please try again later.",
    });
  }
};

// Update QR
const updateQR = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
      });
    }

    const { shortCode } = req.params;
    const { status, destinationUrl, name } = req.body;

    if (!shortCode) {
      return res.status(400).json({
        status: "Bad Request",
        message: "A QR code is required to update the QR details.",
      });
    }

    if (typeof status !== "boolean") {
      return res.status(400).json({
        status: "Bad Request",
        message: "Status must be provided as either true or false.",
      });
    }

    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Please provide a valid QR name within the allowed length.",
      });
    }

    if (typeof destinationUrl !== "string" || !destinationUrl.trim()) {
      return res.status(400).json({
        status: "Bad Request",
        message: "A valid destination URL is required to update the QR code.",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(destinationUrl.trim());
    } catch {
      return res.status(400).json({
        status: "Bad Request",
        message: "A valid destination URL is required to update the QR code.",
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        status: "Bad Request",
        message: "A valid destination URL is required to update the QR code.",
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
        status: "Not Found",
        message: "The QR code you are trying to update could not be found.",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "QR code updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update QR error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to update the QR code. Please try again later.",
    });
  }
};

// Delete single QR
const deleteQR = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
      });
    }

    const { shortCode } = req.params;

    if (!shortCode || typeof shortCode !== "string") {
      return res.status(400).json({
        status: "Bad Request",
        message: "A valid QR code is required to process the delete request.",
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
      status: "Success",
      message: "QR code deleted successfully.",
    });
  } catch (error) {
    console.error("Delete QR error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to delete the QR code. Please try again later.",
    });
  }
};

// Delete multiple QRs
const deleteQRs = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
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
        status: "Bad Request",
        message: "Please provide at least one QR code to delete.",
      });
    }

    const validShortCodes = shortCodes.filter(
      (code) => typeof code === "string" && code.trim().length > 0,
    );

    if (validShortCodes.length === 0) {
      return res.status(400).json({
        status: "Bad Request",
        message: "The provided QR codes contain invalid short codes.",
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
      status: "Success",
      message: "QR codes deleted successfully.",
      data: {
        deletedQrs: qrResult.deletedCount,
        deletedAnalytics: analyticsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete QRs error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message:
        "Unable to delete the selected QR codes. Please try again later.",
    });
  }
};

// Delete all QRs
const deleteAllQrs = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "You must be authenticated to create a QR code.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(401).json({
        status: "Unauthorized",
        message: "You must be authenticated to create a QR code.",
      });
    }

    const [qrResult, analyticsResult] = await Promise.all([
      QRCode.deleteMany({ userId }),
      QRAnalytics.deleteMany({ userId }),
    ]);

    return res.status(200).json({
      status: "Success",
      message: "All QR codes deleted successfully.",
      data: {
        deletedQrs: qrResult.deletedCount,
        deletedAnalytics: analyticsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete all QRs error:", error);
    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to delete all QR codes. Please try again later.",
    });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Authentication is required to delete this account.",
    });
  }

  try {
    const { userId } = decodeToken(token);

    if (!userId) {
      return res.status(404).json({
        status: "Not Found",
        message: "The authenticated user account could not be found.",
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
      status: "Success",
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to delete the account. Please try again later.",
    });
  }
};

//Create Only Short URL
const createShortURL = async (req, res) => {
  const { destinationUrl, shortCode } = req.body;

  if (!destinationUrl || !shortCode) {
    return res.status(400).json({
      status: "Bad Request",
      message:
        "Both destination URL and short code are required to create a short URL.",
    });
  }

  try {
    const shortUrlData = await FirstShortUrl.create({
      destinationUrl,
      shortCode,
    });
    const shortUrl = `${process.env.CLICK_URL.split("/")[2]}/${shortUrlData.shortCode}`;

    return res.status(201).json({
      status: "Created",
      message: "Short URL created successfully.",
      shortUrl,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);

    return res.status(500).json({
      status: "Internal Server Error",
      message: "Unable to create the short URL. Please try again later.",
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
