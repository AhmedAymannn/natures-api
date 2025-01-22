const User = require('../models/usersModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const Email = require('../Scripts/email');

const generateToken = (id) => {
    return jwt.sign(
        { id: id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRESIN }
    )
}
const createSendToken = (user, statusCode, res) => {
    const cookiesOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIES_EXPIRESIN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') {
        cookiesOptions.secure = true;
    }
    const token = generateToken(user._id);
    res.cookie('jwt', token, cookiesOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        user
    });
}
exports.signUp = async (req, res) => {
    try {
        const newUser = await User.create(
            {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                passwordConfirm: req.body.passwordConfirm,   
                role: req.body.role
            }); 
            
        const url = 'url'
        await new Email(newUser, url).sendWelcome();
        createSendToken(newUser, 201, res);


    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}
exports.logIn = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    // check if email and password are exist 
    try {
        if (!email && !password) {
            return res.status().json({
                status: failed,
                message: 'please enter a correct email and password'
            });
        }
        //check if user exist and the password is correct 
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(200).json({
                message: 'please enter a valid email or password '
            })
        }
        createSendToken(user, 201, res);
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}
exports.protect = async (req, res, next) => {
    try {
        let token;
        //1: check if the token exist 
        if (req.headers.authorization
            && req.headers.authorization.toLowerCase().startsWith("bearer")) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ message: "Token is missing or invalid" });
        }
        // 2: verification token 
        const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        console.log(decode);
        //3:check if the user still exist , not has been deleted
        const currentUser = await User.findById(decode.id);
        if (!currentUser) {
            return res.status(401).json({ message: "this token is no more access" });
        }
        //4: check if the user changed the password after the token is set 
        if (currentUser.isChangedAfter(decode.iat)) {
            return res.status(401).json({ message: "Password recently changed! Please log in again " });
        }
        console.log("isChangedAfter result:", currentUser.isChangedAfter(decode.iat));
        req.user = currentUser;
        next();
    } catch (err) {
        console.error("Error in protectGetTours middleware:", err.message);
        res.status(400).json({
            message: err.message
        })
    }
}
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        try {
            console.log('inside the restrictTo ');

            if (!roles.includes(req.user.role)) {
                return res.status(401).json({
                    message: "you are not allowed "
                });
            }
            next();
        } catch (err) {
            console.error("Error in protectGetTours middleware:", err.message);
            res.status(400).json({
                message: err.message
            })
        }
    }
}
exports.forgotPassword = async (req, res, next) => {
    try {
        // 1: search for user by email he sent in post req
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(404).json({
                message: "User not found."
            });
        }
        const passwordResetToken = await user.forgotPassword();
        await user.save({ validationBeforeSave: false });
        // first way for url 
        // const urlResetToken = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${passwordResetToken}`;

        // another static way for url
        const urlResetToken = `http://localhost:3000/api/v1/users/resetPassword/${passwordResetToken}`;
        const message = `
        Forgot your password? Submit a PATCH request to the following link with your new password and the reset token:     
        ${urlResetToken}
        If you did not request a password reset, please ignore this email.`;
        const subject = `you are forgot your password`;
        await new Email(user , urlResetToken ).resetPassword();

    } catch (err) {
        console.error(err.message);
        res.status(400).json({
            message: err.message
        })
    }
}
exports.resetPassword = async (req, res, next) => {
    try {
        // 1: get the token from the URL parameters
        const token = req.params.token;
        // 2: Hash the token from the URL to compare with the hashed token stored in the DB
        const hashedToken = crypto.createHash('sha256')
            .update(token)
            .digest('hex');
        // 3: Find the user by the hashed token and ensure the token is not expired
        const user = await User.findOne({
            randomResetToken: hashedToken,
            randomResetTokenExpired: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        // 4: Now that the token is valid, reset the password
        user.password = req.body.password; // Assuming the new password is in the body of the request
        user.randomResetToken = undefined; // Clear the reset token
        user.randomResetTokenExpired = undefined; // Clear the expiration
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'the new password has been updated successfully '
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({
            message: err.message
        })
    }
}

exports.updateMyPassword = async (req, res, next) => {
    try {
        // 1: get the document of user by id 
        const user = await User.findById(req.user.id).select('+password');
        // 2 : check if posted current password is correct 
        if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
            return res.status(401).json({
                status: 'failed',
                message: 'wrong password tyr again !'
            });
        }
        // 3: if so , update password 
        user.password = req.body.newPassword;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();
        // 4: log user in , send jwt 
        createSendToken(user, 201, res);
    }
    catch (err) {
        console.error('error  :', err.message);
        res.status(400).json({
            message: err.message
        })
    }
}


