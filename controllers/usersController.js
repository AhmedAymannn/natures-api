const User = require('../models/usersModel');
const FeaturesAPI = require('../Scripts/features');
const handlerFactor = require('./handlerFactory');
const path = require('path');
const fs = require('fs');
exports.getUser = handlerFactor.getOne(User);
exports.createNewUser = async (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: 'this route is not yet implemented'
    });
}
exports.getUsers = async (req, res) => {
    try {
        console.log("Inside getUsers");
        let query = User.find();
        //using Class constructor
        const features = new FeaturesAPI(query, req.query);
        query = features
            .filter()
            .sort()
            .limit()
            .fields()
            .query;
        //execute the query
        const users = await query;
        res.status(200).json({
            status: 'success',
            result: users.length,
            data: {
                users
            }
        })
    } catch (error) {
        res.status(400).json(
            {
                message: error.message
            });

    }
}
// updateMe (normal user wants to update information ) 
exports.updateMe = async (req, res, next) => {
    try {
        //1: create error if user posted password to update 
        if (req.body.password || req.body.passwordConfirm || req.body.role) {
            return res.status(400).json({
                status: 'failed',
                message: 'you don not allowed to update this field from here '
            });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            req.body,
            { new: true, runValidators: true })
        if (!user) {
            return res.status(401).json({
                status: 'failed',
                message: 'wrong password tyr again !'
            });
        }
        res.status(200).json({
            status: 'success',
            user
        })
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
}
exports.deleteMe = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, { active: false },);
        if (!user) {
            return res.status(401).json({
                status: 'failed',
                message: 'user did not exist !'
            });
        }
        res.status(204).json({
            message: 'the account deleted successfully ',
            data: null
        });

    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
}

exports.uploadPhoto = async (req, res) => {

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'No user found by this ID'
            });
        }
        if (user.photo) {
            // Delete the old photo from the server (image folder)
            const oldPhotoPath = path.join(__dirname, '../images', user.photo);
            fs.unlink(oldPhotoPath, (err) => {
                if (err) {
                    console.log("Error deleting old photo:", err);
                }
            });
        }
        const updatedUser  = await User.findByIdAndUpdate(req.user.id,
            { photo: req.file.filename },
            
            { new: true })

        if (!updatedUser) {
            res.status(404).json({
                status: 'failed',
                message: 'no user found by this ID'
            })
        }
        res.status(200).json({
            status: 'success',
            data: {
                updatedUser 
            }
        })
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }

}

// updateUser (only for admins )
// exports.updateUser = async (req, res) => {
//     try {
//         const user = await User
//             .findByIdAndUpdate(
//                 req.params.id, req.body,
//                 { new: true, runValidators: true });
//         res.status(200).json({
//             status: 'success',
//             data: {
//                 user
//             }
//         });
//     } catch (error) {
//         res.status(400).json({
//             message: error.message
//         })
//     }
// }





// exports.deleteUser = async (req, res) => {
//     try {
//         await User.findByIdAndDelete(req.params.id);
//         res.status(204).json({
//             status: 'Deleted User successfully',
//             message: 'User deleted successfully',
//             data: null
//         });
//     } catch (error) {
//         res.status(400).json({
//             message: error.message
//         })
//     }
// }