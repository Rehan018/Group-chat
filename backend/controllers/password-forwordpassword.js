// Import necessary modules and dependencies
const User = require('../models/user');
const ForgotPassword = require('../models/forgotpassword'); // Import ForgotPassword model
const sequelize = require('../utils/database'); // Import Sequelize instance
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const sib = require('sib-api-v3-sdk'); // Import SendinBlue SDK for email sending
const uuid = require('uuid'); // Import uuid for generating unique identifiers
require('dotenv').config(); /*dotenv module is used to load environment variables from a 
                              .env file. In this case, it is utilized to load the API key 
                              for SendinBlue email sending*/

/*forgotPassword function handles the process of generating a unique identifier,
 creating a password reset request record in the database, and sending a password 
 reset email to the user.*/
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;//req.body se email nikala jata hai.
    const user = await User.findOne({ where: { email } }); //User model se email ke basis pe user ko search karte hai

    /*code uses the uuid module to generate a unique identifier (requestId)
     for each password reset request. This ensures the uniqueness of the identifier.*/
    const requestId = uuid.v4();

    // Create a new record in the forgotPassword table
    await user.createForgotPassword({ id: requestId, active: true });

    // Send an email to the user with a link to reset the password

    /*code uses the SendinBlue SDK (sib) to send a transactional email 
    to the user for password reset. It sets up the API key, creates an 
    instance of the TransactionalEmailsApi, and sends an email with a password reset link*/
    const client = sib.ApiClient.instance;
    /*Is line mein, sib.ApiClient.instance se ek SendinBlue client ka instance banta hai.
     Yeh instance SendinBlue API ke endpoints ke saath communicate karne ke liye use hota hai.*/
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.API_KEY;
        /*Is code snippet mein, SendinBlue API key set kiya ja raha hai. API key ko environment 
    variable API_KEY se retrieve kiya jata hai, jise aap .env file mein store karte hain*/
    const tranEmailApi = new sib.TransactionalEmailsApi();
    /*Yahan, sib.TransactionalEmailsApi() se ek instance banaya jata hai, jo SendinBlue ke
     Transactional Emails API ke sath interact karne ke liye use hota hai. Iske through aap 
     transactional emails send kar sakte hain.*/

    /*purpose of the sender object is to specify the email address and name of
     the sender when sending a transactional email. In this code snippet, it represents the sender's information for the password reset email sent using the SendinBlue SDK*/
    const sender = {

      /*sender object is used to specify the information about the sender when sending a transactional email. In email communication, it's common to include details about
       the sender, such as the sender's email address and name*/
       email: process.env.SENDER_EMAIL, // Sender's email can be a generic email
       name: process.env.SENDER_NAME,   // Sender's name can be a generic name
      
    };
    const receivers = [
      {
        email: email,// Receiver's email is dynamic and comes from the request
      },
    ];
    tranEmailApi
    /*In this code snippet, a specific method of SendinBlue's *Transactional* Email
     API is being called through the *tranEmailApi* variable, through which 
     a transactional email can be sent.

     Here, a JavaScript object is passed to the sendTransacEmail method,
      which contains all the required details to send the email:*/
      .sendTransacEmail({
        sender,
        to: receivers,
        subject: 'Forgot Password - Please Reset',
        textContent: 'Follow the link to reset your password',
        htmlContent: `Click on the link below to reset your password: <br> <a href="http://localhost:5000/pass/reset/${requestId}">Reset Password</a>`,
      })
      .then((response) => {
        return res
          .status(202)
          .json({ success: true, message: 'Password reset email sent successfully' });
      })
      .catch((err) => console.log(err));
  } catch (error) {
    // Handling errors during the password reset process
    res.status(500).json({ success: false, message: error.message });
  }
};

/*resetPassword function is responsible for handling the user's request to reset their password.
 It checks if the reset password request exists, marks it as inactive, and displays a password
  reset form to the user*/
exports.resetPassword = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const forgotPasswordRequest = await ForgotPassword.findOne({ where: { id: requestId } });

    // Check if the reset password request exists
    if (!forgotPasswordRequest) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    // Mark the reset password request as inactive
    forgotPasswordRequest.update({ active: false });

  /*HTML form in the resetPassword function is displayed to the user for entering a new password.
   It includes a script that prevents the default form submission behavior.*/
    res.status(200).send(`<html>
                              <script>
                                  function formSubmitted(e){
                                      e.preventDefault();
                                      console.log('called')
                                  }
                              </script>
                              <form action="/pass/update/${requestId}" method="POST">
                                  <label for="newpassword">Enter New Password</label>
                                  <input name="newpassword" type="password" required></input>
                                  <button>Reset Password</button>
                              </form>
                          </html>`);
    res.end();
  } catch (error) {
    // Handling errors during the password reset process
    res.status(500).json({ message: error.message });
  }
};

/*updatePassword function uses bcrypt to hash the new password before 
updating the user's password in the database.It ensures the security
 of the user's password by storing it as a hashed value.*/
exports.updatePassword = async (req, res, next) => {
  try {
    const { newpassword } = req.query;
    const requestId = req.params.resetpasswordid;

    // Retrieve the reset password request
    const resetPasswordRequest = await ForgotPassword.findOne({
      where: { id: requestId },
    });

    // Retrieve the user associated with the reset request
    const user = await User.findOne({
      where: { id: resetPasswordRequest.userId },
    });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'No user exists', success: false });
    }

    /*password hashing strength is determined by the saltRounds variable, which is set to 10.
     This variable represents the number of rounds used by bcrypt for password hashing.*/
    const saltRounds = 10;
    bcrypt.hash(newpassword, saltRounds, async (err, hash) => {
      if (err) {
        throw new Error(err);
      }

      // Update the user's password
      await user.update({ password: hash });
      res.status(201).json({ message: 'Password successfully updated' });
    });
  } catch (error) {
    // Handling errors during the password update process
    res.status(403).json({ error: error.message, success: false });
  }
};
