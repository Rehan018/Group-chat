const path = require('path');
const passwordController = require('../controllers/password-forwordpassword');
const authMiddleware = require('../middleware/auth');  // Assuming auth middleware is used here

const express = require('express');
const router = express.Router();

router.get('/reset/:id',passwordController.resetPassword);
router.get('/update/:resetpassid', passwordController.updatePassword);

// router.get('/forgot', passwordController.forgotPassword);

module.exports = router;