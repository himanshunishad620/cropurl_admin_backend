const { app } = require("../app");
const connectDB = require("../config/db");
connectDB();

app.get("/", (req, res) => res.send("himanshu"));

module.exports = app;
// const PORT = 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
