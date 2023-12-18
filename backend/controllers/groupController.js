//Dependencies:
const bcrypt = require("bcrypt"); // Library for password hashing
const sequelize = require("../utils/database"); // Sequelize instance for database interaction
const jwt = require("jsonwebtoken"); // JSON Web Token library for authentication
const { Op } = require("sequelize"); // Sequelize operators for queries
const SECRET_KEY = process.env.SECRET_KEY; // Secret key for JWT, retrieved from environment variables

// Models
const Group = sequelize.models.group; // Sequelize model for Group
const GroupUser = sequelize.models.groupUser; // Sequelize model for GroupUser
const User = sequelize.models.user; // Sequelize model for User
const GroupMessage = sequelize.models.groupMessage; // Sequelize model for GroupMessage

// Function to add a group

/*The addGroup function is used to create a new group. It takes input from the request body,
 including the group name and a list of user IDs to be added to the group. 
 The function verifies the user's JWT token, retrieves the admin user ID,
creates a new group in the database, adds users to the group, and responds 
with the list of users in the group*/
exports.addGroup = (req, res, next) => {
  /*let body = req.body; is used to extract the request body from an incoming HTTP 
  request. In a typical Express.js application, req.body contains the data submitted 
  in the request body, commonly used in POST or PUT requests where data is sent from
   a client to the server.*/
  let body = req.body;

  let token = req.headers.token;
  if (body !== undefined && token !== undefined) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      // Retrieve admin user ID from the decoded token
      let admin = decryptToken.userId;
      let users = body.users;
      let groupName = body.name;

      // First Create Group
      try {
        // Create a new group in the database
        let group = await Group.create({
          name: groupName,
          creator: admin,
        });

        try {
          // Add users to the group
          users.push(Number(admin));
          for (const user of users) {
            // Check if the user is an admin
            let isAdmin = decryptToken.userId === user ? true : false;
            // Create GroupUser association
            await GroupUser.create({
              /*This line creates an association between a group and a user in a database table, */
              groupId: group.id,
              userId: user,
              admin: isAdmin,
            });
          }

          // Retrieve the list of users in the group
          let groupList = await GroupUser.findAll({
            where: { groupId: group.id },
          });
          res.status(201).json({ status: "success", data: [groupList] });
        } catch (err) {
          res.status(500).json({ status: "error", message: "Server Error" });
        }
      } catch (err) {
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    // Handle cases where request body or token is missing
    if (body === undefined) {
      res
        .status(205)
        .json({ status: "error", message: "Client needs to resend data" });
    } else {
      res
        .status(205)
        .json({ status: "error", message: "User not logged in yet" });
    }
  }
};

// Function to get information about groups associated with a particular user

/*The getUserGroupInformation function retrieves information about groups 
associated with a particular user. It verifies the user's JWT token, 
retrieves the user ID, queries the database for groups associated with 
the user, and responds with detailed information about each group, 
including admin status*/
exports.getUserGroupInformation = (req, res, next) => {
  let body = req.body;
  let token = req.headers.token;
  if (body !== undefined && token !== undefined) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        res.status(401).json({ status: "error", message: "token is wrong" });
      }
      let user = decryptToken.userId;

      try {
        // Retrieve all groups associated with the user, including associated data
        let group = await GroupUser.findAll({
          include: {
            all: true,
          },
          where: {
            userId: user,
          },
        });

        // Process the retrieved data and prepare a response
        let responseGroup = [];
        for (const data of group) {
          let id = data.dataValues.groupId;

          // Retrieve information about a specific group
          let group = await Group.findOne({ where: { id: id } });

          // Create an object with group information and admin status
          let obj = {};
          obj["group"] = group;
          obj["isAdmin"] = data.admin;
          responseGroup.push(obj);
        }

        res
          .status(200)
          .json({ status: "success", data: { groups: responseGroup } });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    // Handle cases where request body or token is missing
    if (body === undefined) {
      res
        .status(205)
        .json({ status: "error", message: "Client needs to resend data" });
    } else {
      res
        .status(205)
        .json({ status: "error", message: "User not logged in yet" });
    }
  }
};

// Function to get specific group information and its users
exports.getSingleGroupInformation = (req, res, next) => {
  let body = req.body;
  let token = req.headers.token;
  let groupId = req.params.id;
  if (body !== undefined && token !== undefined) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        res.status(401).json({ status: "error", message: "token is wrong" });
      }

      try {
        // Retrieve all users in a specific group
        let groupUsers = await GroupUser.findAll({
          where: {
            groupId: groupId,
          },
        });

        // Retrieve information about the specific group
        let group = await Group.findOne({ where: { id: groupId } });

        res.status(200).json({
          status: "success",
          data: { group: group, user: groupUsers },
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    // Handle cases where request body or token is missing
    if (body === undefined) {
      res
        .status(205)
        .json({ status: "error", message: "Client needs to resend data" });
    } else {
      res
        .status(205)
        .json({ status: "error", message: "User not logged in yet" });
    }
  }
};

/*The storeMessage function is responsible for storing group messages.
 It verifies the user's JWT token, retrieves the group ID, user ID, 
 and message from the request body, creates a new group message 
 in the database, and responds with a 201 status and the ID of 
 the stored message.*/
exports.storeMessage = (req, res, next) => {
  let body = req.body;
  let token = req.headers.token;
  if (body !== undefined && token !== undefined) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }

      let groupId = body.groupId;
      let userId = decryptToken.userId;
      let message = body.message;

      try {
        // Create a new group message in the database
        let messageObj = await GroupMessage.create({
          groupId: groupId,
          message: message,
          userId: userId,
        });

        res
          .status(201)
          .json({ status: "success", data: { id: messageObj.id } });
      } catch (err) {
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    if (body === undefined) {
      res
        .status(205)
        .json({ status: "error", message: "Client needs to resend data" });
    } else {
      res
        .status(205)
        .json({ status: "error", message: "User not logged in yet" });
    }
  }
};

/*The getAllMessages function retrieves all messages for a specific group, 
excluding messages with IDs less than a specified skip value. 
It verifies the user's JWT token, retrieves the group ID from 
the query parameters, and responds with the messages and the user's ID*/
exports.getAllMessages = (req, res, next) => {
  let token = req.headers.token;
  let group = req.query.id;
  let skip = req.query.skip !== undefined ? req.query.skip : 0;
  if (token !== undefined && group) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        console.log(err);
      }

      try {
        let messageObj = await Group.findAll({
          include: {
            model: GroupMessage,
            include: { model: User, attributes: ["name", "id"] },
            where: {
              id: {
                [Op.gt]: [skip],
              },
            },
          },
          where: {
            id: group,
          },
        });

        res.status(201).json({
          status: "success",
          data: { message: messageObj, self: decryptToken.userId },
        });
      } catch (err) {
        res.status(500).json({ status: "error", message: "Server Error" });
      }
    });
  } else {
    res
      .status(205)
      .json({ status: "error", message: "User not logged in yet" });
  }
};

/*groupFriends function retrieves information about friends and
 non-friends associated with a specific group. It verifies 
 the user's JWT token, retrieves the group ID from the query
  parameters, and responds with a list of friends and non-friends in the group*/
exports.groupFriends = (req, res, next) => {
  id = req.query.id;
  token = req.headers.token;
  if (id && token) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        res.status(205).json({ status: "error", message: "Bad token" });
      }

      let userId = decryptToken.userId;
      try {
        let group = await GroupUser.findAll({
          where: { groupId: id },
        });

        // Lets create friends and none friends list
        let friends = [];
        let notFriends = [];
        let friendsId = [];
        if (group.length > 0) {
          for (const dt of group) {
            let groupUser = dt.dataValues.userId;

            if (Number(groupUser) !== Number(userId)) {
              try {
                let user = await User.findOne({
                  where: { id: groupUser },
                  attributes: ["id", "name"],
                });

                obj = {};
                obj["user"] = user;
                obj["isAdmin"] = dt.dataValues.admin;
                friends.push(obj);
                friendsId.push(user.id);
              } catch (err) {
                res
                  .status(500)
                  .json({ status: "error", message: "Internal server error" });
              }
            }
          }
        }

        try {
          notFriends = await User.findAll({
            where: {
              id: {
                [Op.and]: {
                  [Op.notIn]: friendsId,
                  [Op.not]: userId,
                },
              },
            },
            attributes: ["id", "name"],
          });
        } catch (err) {
          res
            .status(500)
            .json({ status: "error", message: "Internal server error" });
        }
        res.status(200).json({
          status: "success",
          data: { friends: friends, notFriends: notFriends },
        });
      } catch (err) {
        res
          .status(500)
          .json({ status: "error", message: "Internal server error" });
      }
    });
  } else {
    if (!token) {
      res
        .status(403)
        .json({ status: "error", message: "You need to logged in first" });
    }

    res.status(205).json({ status: "error", message: "Can not find group id" });
  }
};

/*removeGroupUser function removes a user from a group. It verifies the user's JWT token, 
retrieves the group and user IDs from the request body, and deletes the corresponding 
GroupUser association from the database*/
exports.removeGroupUser = (req, res, next) => {
  token = req.headers.token;
  body = req.body;
  if (id && token && body) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        res.status(205).json({ status: "error", message: "Bad token" });
      }

      try {
        let groupUser = await GroupUser.destroy({
          where: {
            groupId: body.groupId,
            userId: body.userId,
          },
        });

        res.status(201).json({ status: "success" });
      } catch (err) {
        res
          .status(500)
          .json({ status: "error", message: "Internal server error" });
      }
    });
  } else {
    if (!token) {
      res
        .status(403)
        .json({ status: "error", message: "You need to logged in first" });
    }
    if (!body) {
      res.status(205).json({ status: "error", message: "Need to resend data" });
    }
    res.status(205).json({ status: "error", message: "Can not find group id" });
  }
};

exports.addGroupUser = (req, res, next) => {
  token = req.headers.token;
  body = req.body;
  if (id && token && body) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        res.status(205).json({ status: "error", message: "Bad token" });
      }

      try {
        let groupUser = await GroupUser.create({
          groupId: body.groupId,
          userId: body.userId,
          admin: false,
        });

        res.status(201).json({ status: "success" });
      } catch (err) {
        res
          .status(500)
          .json({ status: "error", message: "Internal server error" });
      }
    });
  } else {
    if (!token) {
      res
        .status(403)
        .json({ status: "error", message: "You need to logged in first" });
    }
    if (!body) {
      res.status(205).json({ status: "error", message: "Need to resend data" });
    }
    res.status(205).json({ status: "error", message: "Can not find group id" });
  }
};

/*adminModify function modifies the admin status of a user within a group.
 It verifies the user's JWT token, retrieves the group and user IDs 
 from the request body, finds the corresponding GroupUser record, 
 toggles the admin status, and saves the changes*/
exports.adminModify = (req, res, next) => {
  token = req.headers.token;
  body = req.body;
  if (id && token && body) {
    jwt.verify(token, SECRET_KEY, async function (err, decryptToken) {
      if (err) {
        res.status(205).json({ status: "error", message: "Bad token" });
      }

      try {
        let user = await GroupUser.findOne({
          where: {
            userId: body.userId,
            groupId: body.groupId,
          },
        });

        if (user) {
          user.admin = !user.admin;

          await user.save();
        }

        res.status(201).json({ status: "success" });
      } catch (err) {
        res
          .status(500)
          .json({ status: "error", message: "Internal server error" });
      }
    });
  } else {
    if (!token) {
      res
        .status(403)
        .json({ status: "error", message: "You need to logged in first" });
    }
    if (!body) {
      res.status(205).json({ status: "error", message: "Need to resend data" });
    }
    res.status(205).json({ status: "error", message: "Can not find group id" });
  }
};
