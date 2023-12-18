/*const sequelize = require("../utils/database");: Requires a Sequelize instance configured in the ../utils/database file.*/
const sequelize = require("../utils/database");
/*const { Op } = require("sequelize");: Destructures the Sequelize operators for use in queries.*/
const { Op } = require("sequelize");
/*JWT is used for token generation and verification.
 It helps secure communication between the client and 
 server by providing a means of authentication.*/

const jwt = require("jsonwebtoken");

/*const SECRET_KEY = process.env.SECRET_KEY;: Retrieves the secret key for JWT from the environment variables.*/
/*process.env.SECRET_KEY retrieves the secret key for JWT from environment 
variables. It's crucial for securing JWT-based authentication.*/
const SECRET_KEY = process.env.SECRET_KEY;

// Yeh lines Sequelize models ko import karte hain, jinhe sequelize instance se create kiya gaya hai
const User = sequelize.models.user;
const Message = sequelize.models.message;

// const Message = sequelize.models.message;
const Friends = sequelize.models.friendsRelation;

/*The allFriends function retrieves a list of friends for a user based on 
their JWT token. It uses Sequelize to query the database and sends a JSON 
response with the user's information and their friends.*/
exports.allFriends = (req, res, next) => {
  let token = req.headers.token;

  if (token !== "") {
    /*The code checks if the token is not empty and verifies it using the
     jwt.verify method. If there are errors during verification, 
     it logs the error. If the token is empty or invalid,
      it responds with a status of 404 and an error message.*/
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }
      try {
        /*Sequelize methods like findAll and create are used to interact with the database.*/
        let friends = await User.findAll({
          where: {
            id: {
              /*The Op object provides Sequelize operators used in queries. 
              It's used for filtering records, and in this code, [Op.ne]
               is used to represent "not equal."*/
              [Op.ne]: decryptToken.userId,

              /*In Sequelize, [Op.ne] is an operator representing "not equal." 
              It is used in queries to filter records where a particular attribute 
              is not equal to a specified value. In the provided code snippet, 
              [Op.ne]: decryptToken.userId is used in a Sequelize query to filter
               out records where the id attribute is not equal to the userId stored
              in the decryptToken object*/
            },
          },
          attributes: ["id", "name"],
          /*attributes option is used to selectively retrieve and include only specific database columns ("id", "name")
           in query results, optimizing performance by reducing unnecessary data transfer and processing.*/

          /*If i remove the attributes option or provide an empty array [], Sequelize will retrieve all columns from the specified model's table in the query results.*/
        });
        /*is used to send a JSON response back to the client after successfully executing an operation*/
        res.status(200).json({
          /*res.status(200): Sets the HTTP status code of the response to 200, which indicates a successful request.*/
          status: "success",
          data: { user: decryptToken.name, friends: friends },
          /*Converts the provided JavaScript object into a JSON string and sends it as the response
           body. The object contains two properties:
           status: A string indicating the status of the operation, which is set to "success" in this case.
           data: An object containing the data to be sent back to the client. In this context,
            it includes information about the user (decryptToken.name) and their friends (friends), 
            which are obtained as a result of the operation.*/
        });
      } catch (error) {
        console.log(error);
      }
    });
  } else {
    res.status(404).json({ status: "error", message: "User Not Found." });
  }
};

/*The addFriend function allows a user to add a friend.
 It extracts the user ID from the JWT token and the friend's
  ID from the request body. It then creates a new record in 
  the Friends model and responds with the updated friend list.*/
exports.addFriend = (req, res, next) => {
  /*It retrieves the value of the 'token' header from the HTTP request.
 assumes that the client includes a 'token' in the headers of the request,
  likely for authentication purposes.*/
  let token = req.headers.token;
  /*It retrieves the entire body of the HTTP request.
  assumes that the client includes data in the body of the request,
   usually in a POST or PUT request.*/
  let body = req.body;
  // Check if token is not empty and request body exists
  if (token !== "" && body) {
    // Verify the JWT token
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }
      try {
        // If the token is successfully verified, execute the following code
        // Create a new record in the Friends model
        let friends = await Friends.create({
          fromUser: decryptToken.userId,/*sets the value of the fromUser column in the Friends model to the userId extracted
                                           from the decryptToken object. This assumes that the Friends model has a column
                                            named fromUser that is used to store the user initiating the friend request.*/
                                            
          toUser: body.id,/*sets the value of the toUser column in the Friends model to the id extracted from the body of 
                          the HTTP request. It assumes that the client has provided the friend's user ID in the request body.*/
        });
        // Respond with a JSON success message and data
        res.status(200).json({
          status: "success",
          data: { user: decryptToken.name, friends: friends },
        });
      } catch (error) {
        // Log any errors that occur during the process
        console.log(error);
      }
    });
  } else {
    // Respond with a JSON error message if token or body is empty
    res.status(404).json({ status: "error", message: "User Not Found." });
  }
};

/*The chatList function retrieves a list of friends for a user, 
including additional information through eager loading. 
It excludes the Message model and responds with the user's
 information and their friends.*/
exports.chatList = (req, res, next) => {
  let token = req.headers.token;
  let body = req.body;
  if (token !== "" && body) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }
      try {
        /*The try-catch blocks are used to handle potential errors that may occur 
        during the execution of asynchronous operations (such as database queries 
          or JWT verification). Errors are caught, logged, and not propagated 
          further to prevent the server from crashing.*/

        let friends = await User.findAll({ 
          //User.findAll: This is a Sequelize method used to find all instances of the User model that match the specified conditions
          /*include, exclude: Sequelize options for eager loading and excluding associations*/
          include: { all: true },// is used for eager loading associations. It includes all associations of the User model when retrieving the data
          exclude: { model: Message },
          /*This is excluding the Message model from the associations. It means that even though all associations are included,
           instances of the Message model won't be fetched along with the User instances*/
          where: {
            id: decryptToken.userId,
          },
          attributes: ["id", "name"],
        });

        res.status(200).json({
          status: "success",
          data: { user: decryptToken.name, friends: friends },
        });
      } catch (error) {
        console.log(error);
      }
    });
  } else {
    res.status(404).json({ status: "error", message: "User Not Found." });
  }
};
