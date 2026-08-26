const jwt = require("jsonwebtoken");
require("dotenv").config();
const generateToken = (data) => {
  const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "4d" });
  return token;
};
const decodeToken = (token) => {
  let data = null;
  try {
    data = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.log("Invalid Token");
  }
  return data;
};
module.exports = { generateToken, decodeToken };
