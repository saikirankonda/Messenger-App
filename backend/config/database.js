const mongoose = require("mongoose");

const databaseConnect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("Connected to DB Successfully");
  } catch (err) {
    console.log("Error : ", err.message);
  }
};

module.exports = databaseConnect;
