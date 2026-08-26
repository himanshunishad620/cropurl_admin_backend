const { app } = require("../app");
const connectDB = require("../config/db");
connectDB();

module.exports = app;
// const PORT = 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
