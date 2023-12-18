const sequelize = require("../utils/database");
/*bcrypt library is used to hash passwords securely before storing them in the database.
 It enhances security by converting plaintext passwords into a hashed representation,
  making it challenging for attackers to retrieve the original passwords*/
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const SALT = 10;
const SECRET_KEY = process.env.SECRET_KEY;

// Model
const User = sequelize.models.user;

/*signupValidator function validates the request body for the signup route, 
ensuring it contains a valid email, name, password, and phone. 
It returns true if the validation succeeds; otherwise, it returns false*/ 

const signUpValidator = (body) => {

  // body is javascript object it is repersent HTTP body request
  // Check if the request body is undefined
  if (body === undefined) return false;

  // Validate email, name, password, and phone fields
  return (
    validator.isEmail(body.email) &&
    body.name !== undefined &&
    body.password !== undefined &&
    body.phone !== undefined
  );
};

/*loginValidator function validates the request body for the login route, ensuring it
 contains a valid email and password. It returns true if the validation succeeds;
  otherwise, it returns false*/
const loginValidator = (body) => {
  // Check if the request body is undefined
  if (body === undefined) return false;

  // Validate email and password fields
  return validator.isEmail(body.email) && body.password !== undefined;
};

// SignUp
exports.signup = (req, res, next) => {
  let token = req.headers.token;

  // Check if a token is present
  if (token) {
    // 409 Conflict
    res
      .status(409)
      .json({ status: "error", message: "User is already registered." });
  } else {
    let body = req.body;

    // Validate the request body using the signUpValidator function
    if (signUpValidator(body)) {
      /*code uses bcrypt.hash to securely hash the user's password with a specified salt factor (SALT). 
      The hashed password is then stored in the database.*/
      bcrypt
        .hash(body.password, SALT)
        .then(async (result) => {
          try {
            // Create a new user record in the database
            let object = await User.create({ ...body, password: result });

            // Respond with a success status and user information
            res.status(201).json({
              status: "success",
              user: { id: object.id, name: object.name },
            });
          } catch (error) {
            // Handle database errors
            res.json({ status: "error", message: error.errors[0].message });
          }
        })
        .catch((error) => {
          // Handle bcrypt errors
          console.log(error.errors[0].message);
          res.json({ status: "error", message: error.errors[0].message });
        });
    } else {
      // Respond with an error status if the request body is missing required fields
      res.status(200).json({ status: "error", message: "Missing in Content" });
    }
  }
};

// Login
exports.login = async (req, res, next) => {
  let token = req.headers.token;

  // Check if a token is present
  if (token) {
    // Respond with an error status if the user is already registered
    res
      .status(409)
      .json({ status: "error", message: "User is already registered." });
  } else {
    let body = req.body;
    // Validate the request body using the loginValidator function
    if (loginValidator(body)) {
      let email = body.email;
      let password = body.password;

      try {
        // Find the user in the database based on the provided email
        let user = await User.findOne({ where: { email: email } });

        if (user) {
         /*User authentication during login involves comparing the provided password with the 
         stored hashed password using bcrypt.compare. If the passwords match, a JWT token 
         is generated and sent in the response headers for subsequent authentication*/
          bcrypt.compare(password, user.password, function (err, result) {
            if (err) console.log(err);

            if (result) {
              // Generate a JWT token if the password matches
              let token = jwt.sign(
                { userId: user.id, name: user.name },
                SECRET_KEY
              );
              // Set headers to expose the token and respond with success status
              res.set({ "Access-Control-Expose-Headers": "token" });
              res.set("token", token);
              res
                .status(200)
                .json({
                  status: "success",
                  message: "User Logged in ...",
                  self: user.id,
                });
            } else {
              // Respond with an error status if the password doesn't match
              res
                .status(401) // Password is not correct
                .json({ status: "error", message: "Password is not matching" });
            }
          });
        } else {
          // Respond with an error status if the user is not found
          res.status(404).json({ status: "error", message: "User not found" });
        }
      } catch (err) {
        console.log("Error in Fetching User");
      }
    } else {
       // Respond with an error status if the request body is missing required fields
      res.status(200).json({ status: "error", message: "Missing in Content" });
    }
  }
};
