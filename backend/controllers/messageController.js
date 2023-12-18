// Importing necessary dependencies
const sequelize = require("../utils/database");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

/*code uses the destructured [Op] object to access Sequelize operators.
 In this case, it specifically uses [Op.and] to create logical AND 
 conditions in constructing the Sequelize query for message retrieval*/
const { Op } = require("sequelize");

// Salt factor for bcrypt hashing
/*SALT variable represents the number of rounds used by the bcrypt algorithm 
for password hashing. Increasing the number of rounds makes the hash function 
more computationally intensive, enhancing resistance to brute-force attacks*/
const SALT = 10;
// Secret key for JWT authentication
/*SECRET_KEY is used for JWT authentication.
 It is used to sign and verify JWT tokens to 
 ensure the security and authenticity of the users*/
const SECRET_KEY = process.env.SECRET_KEY;

// Model definitions
const User = sequelize.models.user;
const Message = sequelize.models.message;

/*storeMessage function is designed to store a new message in the database.
 It verifies the JWT token, extracts the user's ID and the message content
from the request body, creates a new message record in the database,
and responds with details of the user and the stored message.*/
exports.storeMessage = async (req, res, next) => {
  // Extracting token and request body
  let token = req.headers.token;
  let body = req.body;

  // Checking if token and message are present
  if (token !== "" && body.message) {
    // Verifying the JWT token
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }
      try {
        // Creating a new message record in the database
        let message = await Message.create({
          userId: decryptToken.userId,
          message: body.message,
          toUser: body.to,
        });

        // Sending success response with user and message details
        res.status(201).json({
          status: "success",
          data: { user: decryptToken.name, message: message.id },
        });
      } catch (error) {
        console.log(error);
        // Handling server error
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    // Sending error response if token or message is not provided
    res.status(404).json({ status: "error", message: "User Not Found." });
  }
};

/*getAllMessages function retrieves all messages between two users based on their IDs.
 It verifies the JWT token, extracts the user's ID and skip value from the request body,
queries the database for messages between the sender and receiver, and responds with 
details of the user and the retrieved messages.*/
exports.getAllMessages = async (req, res, next) => {
  // Extracting token and request body
  let token = req.headers.token;
  let body = req.body;

  // Checking if token and body are present
  if (token !== "" && body) {
    // Extracting skip value or setting it to 0 if not provided
    let skip = body.skip !== undefined ? body.skip : 0;

    // Verifying the JWT token
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }
      try {
        // Retrieving messages based on sender and receiver IDs
        let message = await Message.findAll({
          where: {
            /*code uses Sequelize's [Op.and] to create logical AND conditions in the query.
             It constructs conditions for messages from the sender to the receiver and messages
              from the receiver to the sender. The query also includes a condition to filter
               messages based on their ID being greater than the provided skip value*/

            // Using Sequelize's [Op.and] to create a logical AND condition
            [Op.and]: [
              /*In Sequelize, the [Op.and] is used to create a logical AND condition 
              when constructing queries. It allows you to specify multiple conditions
               that must all be true for a record to be included in the result set*/
              {
                // Messages from sender to receiver
                [Op.and]: [
                  {
                    userId: decryptToken.userId, // Sender's user ID is present in the JWT token.
                  },
                  {
                    toUser: body.to, // Receiver's user ID
                  },
                ],
              },
              {
                // Messages from receiver to sender
                [Op.and]: [
                  {
                    userId: body.to, // Receiver's user ID
                  },
                  {
                    toUser: decryptToken.userId, // Sender's user ID
                  },
                ],
              },
            ],
            // Additional condition to filter messages based on their ID
            id: {
              /*[Op.gt] operator is used in the Sequelize query to specify
               a condition where the message ID must be greater than the 
               provided skip value. It helps in retrieving messages beyond a
                certain point.*/

              [Op.gt]: [skip], // Retrieve messages with ID greater than 'skip'
            },
          },
        });

        // Sending success response with user and message details
        res.status(201).json({
          status: "success",
          data: { user: decryptToken.name, message: message },
        });
      } catch (error) {
        console.log(error);
        // Handling server error
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    // Sending error response if token or body is not provided
    res.status(404).json({ status: "error", message: "User Not Found." });
  }
};
