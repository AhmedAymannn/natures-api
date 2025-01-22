
const Tour = require('../models/toursModel');
const FeaturesAPI = require('../Scripts/features');
const filterFunction = require('../Scripts/filters');
const sortFunction = require('../Scripts/sort');
const handlerFactory = require('./handlerFactory');


exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour); 
exports.getTour = handlerFactory.getOne(Tour);

exports.getTours = async (req, res) => {
    try {
        let query = Tour.find();
        //using Class constructor
        const features = new FeaturesAPI(query, req.query);
        query = features
            .filter()
            .sort()
            .limit()
            .fields()
            .query;
        //execute the query
        const tours = await query;
        //sending response
        res.status(200).json({
            result: tours.length,
            data: {
                tours
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'Failed',
            message: error.message
        });
    }
}
exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: 'created successfully',
            data: {
                newTour
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'Failed',
            message: 'Could not create tour',
            message: error.message // Include error message for debugging
        });
    }
}
exports.filterTour = async (req, res) => {
    //filter post body request
    const filter = filterFunction.filterPostTours(req);
    try {
        const tours = await Tour.find(filter);
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'Failed to filter tours',
            error: error.message
        });
    }
}

exports.sortTours = async (req, res) => {
    try {
        let sort = sortFunction(req);
        const sortedTours = await Tour.find().sort(sort);
        // const sortedTours = await Tour.find().sort({durations :1});
        res.status(200).json({
            status: 'success',
            data: {
                sortedTours
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'Failed to sort tours',
            error: error.message
        });
    }
}