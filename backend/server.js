const express = require("express");
const dotenv = require("dotenv");
const databaseConnect = require("./config/database");
const authRoute = require("./routes/authRoute");
const messengerRoute = require("./routes/messengerRoute");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;
dotenv.config({ path: "backend/config/config.env" });

app.use(bodyParser.json());
app.use(cookieParser());

databaseConnect();

app.use("/api/messenger", authRoute);
app.use("/api/messenger", messengerRoute);

app.get("/", (req, res) => {
  res.send("This is whatsapp backend");
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
