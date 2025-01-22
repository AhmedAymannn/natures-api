    const Review = require('../models/reviewsModel');
    const handlerFactory =require('./handlerFactory');

    exports.getReviews = handlerFactory.getMany(Review);
    exports.getReview = handlerFactory.getOne(Review);
    exports.updateReview = handlerFactory.updateOne(Review);


    
    exports.CreateReview = async (req, res) => {
        try {
            // Merge req.body and user ID
            const reviewData = { ...req.body, user: req.user.id , tour : req.params.tourId};
            
            const newReview = await Review.create(reviewData);

            if (!newReview) {
                return res.status(400).json({
                    status: 'failed',
                    message: `please submet a review details`
                });
            }

            res.status(200).json({
                status: 'success',
                message: `the review created succesfully  `,
                data: {
                    newReview
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: `Something went wrong: ${error.message}`
            })
        }
    }

    exports.deleteReview = async (req, res) => {
        try {

            // Step 1: Check if the review ID is provided in the request parameters
            if (!req.params.id) {
                return res.status(400).json({
                    status: 'failed',
                    message: `please pass an ID to search  `
                });
            }
            // Step 2: Find the review by ID from the database
            const review = await Review.findById(req.params.id);
            if (!review) {
                return res.status(404).json({
                    status: 'Not found',
                    message: `your ID doesn't match any review `
                });
            }
            // Step 3: Check if the logged-in user is the owner of the review
            if (review.user.toString() !== req.user.id) {
                return res.status(403).json({
                    status: 'Forbidden',
                    message: 'You can only delete your own reviews',
                });
            }
            // Step 4: If the user is the owner, proceed to delete the revie
            await Review.findByIdAndDelete(req.params.id);
            res.status(200).json({
                status: 'successfully deleted',
                data: null
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: `Something went wrong: ${error.message}`
            });
        }
    }

