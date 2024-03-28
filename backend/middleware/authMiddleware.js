const jwt = require("jsonwebtoken");

module.exports.authMiddleware = async (req, res, next) => {
  const { authToken } = req.cookies;
  if (authToken) {
    const doCodeToken = await jwt.verify(authToken, process.env.SECRET);
    req.myId = doCodeToken.id;
    next();
  } else {
    res.status(400).json({
      error: {
        errorMessage: "Please Login to access this page",
      },
    });
  }
};
