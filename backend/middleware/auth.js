const jwt = require("jsonwebtoken");
const User = require("../models/user");


const authenticateUser = (req, res, next) => {
    try {
      const token = req.header("Authorization");
      // console.log(token);
  
      const decodedToken = jwt.verify(token, "whereistoken");
      const userId = decodedToken.userId;
  
      User.findByPk(userId)
        .then((user) => {
          // Returns the user object with details
          console.log(JSON.stringify(user));
          req.user = user; // Global req object across functions
          next();
        })
        .catch((err) => console.log(err));
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "Unauthorized" });
    }
  };
  
  module.exports = { authenticateUser };
  