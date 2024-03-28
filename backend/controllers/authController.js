const { formidable } = require("formidable");
const validator = require("validator");
const registerModel = require("../models/authModel");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports.userRegister = (req, res) => {
  const form = formidable();
  form.parse(req, async function (err, fields, files) {
    const { userName, email, password, confirmPassword } = fields;
    const { image } = files;
    const error = [];
    if (!userName) {
      error.push("Please Provie your User Name");
    }
    if (!email) {
      error.push("Please Provide Your Email");
    }
    if (email && !validator.isEmail(email)) {
      error.push("Please provide a Valid Email");
    }
    if (!password) {
      error.push("Please Provide Your Password");
    }
    if (!confirmPassword) {
      error.push("Please Provide Your confirmPassword");
    }
    if (password && confirmPassword && password !== confirmPassword) {
      error.push("Your password and confirmPassword are not same.!!");
    }
    if (password && password.length < 6) {
      error.push("Please Provide Your password of 6Characters atleast");
    }
    if (Object.keys(files).length === 0) {
      error.push("Please Provide User Image");
    }
    if (error.length > 0) {
      res.status(400).json({
        error: {
          errorMessage: error,
        },
      });
    } else {
      const getImageName = files?.image?.originalFilename;

      const randomNumber = Math.floor(Math.random() * 99999);
      const newImageName = randomNumber + getImageName;
      files.image.originalFilename = newImageName;

      const newPath =
        __dirname +
        `../../../frontend/public/image/${files?.image?.originalFilename}`;
      console.log(newPath);

      try {
        const checkUser = await registerModel.findOne({ email });

        if (checkUser) {
          res.status(404).json({
            error: {
              errorMessage: ["Your Email is already registered"],
            },
          });
        } else {
          fs.copyFile(files.image.filepath, newPath, async (error) => {
            if (!error) {
              const userCreate = await registerModel.create({
                userName,
                email,
                password: await bcrypt.hash(password, 10),
                image: files.image.originalFilename,
              });
              const token = jwt.sign(
                {
                  id: userCreate._id,
                  email: userCreate.email,
                  userName: userCreate.userName,
                  image: userCreate.image,
                  registerTime: userCreate.createdAt,
                },
                process.env.SECRET,
                {}
              );

              const options = {
                expires: new Date(
                  Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
                ),
              };
              res.status(201).cookie("authToken", token, options).json({
                successMessage: "Your Registration successful",
                token,
              });
            } else {
              res.status(500).json({
                error: {
                  errorMessage: ["Internal Server Error"],
                },
              });
            }
          });
        }
      } catch (err) {
        res.status(500).json({
          error: {
            errorMessage: ["Internal Server Error"],
          },
        });
      }
    }
  });
};

module.exports.userLogin = async (req, res) => {
  const error = [];
  const { email, password } = req.body;
  if (!email) {
    error.push("Please provide your Email address");
  }
  if (!password) {
    error.push("Please provide your Password");
  }
  if (email && !validator.isEmail(email)) {
    error.push("Please enter a valid email");
  }
  if (error.length > 0) {
    res.status(400).json({
      error: { errorMessage: error },
    });
  } else {
    try {
      const checkUser = await registerModel
        .findOne({ email })
        .select("+password");
      if (checkUser) {
        const matchPassword = await bcrypt.compare(
          password,
          checkUser.password
        );
        if (matchPassword) {
          const token = jwt.sign(
            {
              id: checkUser._id,
              email: checkUser.email,
              userName: checkUser.userName,
              image: checkUser.image,
              registerTime: checkUser.createdAt,
            },
            process.env.SECRET,
            { expiresIn: process.env.TOKEN_EXP }
          );
          const options = {
            expires: new Date(
              Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
            ),
          };
          res.status(200).cookie("authToken", token, options).json({
            successMessage: "Your Login successful",
            token,
          });
        } else {
          res.status(400).json({
            error: {
              errorMessage: ["Your Password is not Valid"],
            },
          });
        }
      } else {
        res.status(400).json({
          error: {
            errorMessage: ["Your Email not Found"],
          },
        });
      }
    } catch (err) {
      res.status(404).json({
        error: {
          errorMessage: ["Internal Server Error"],
        },
      });
    }
  }
};

module.exports.userLogout = async (req, res) => {
  res.status(200).cookie("authToken", "").json({
    success: true,
  });
};
