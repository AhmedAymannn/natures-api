const mongoose = require('mongoose');
exports.getMany = Model => async (req, res) => {
    try {
        const docs = await Model.find();
        if(!docs){
                return res.status(404).json({
                status: 'failed',
                message: `No collections found`
            });
        };
        res.status(200).json({
            status: 'success',
            Result: docs.length,
            data: {
                docs
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Something went wrong: ${error.message}`
        });
    }
}

exports.getOne = Model=> async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: 'failed',
                message: `please pass an ID to search  `
            });
        }
        const doc = await Model.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({
                status: 'Not found',
                message: `youe ID doesn't match any review  `
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Something went wrong: ${error.message}`
        });
    }
}
exports.createOne = (Model) => async (req, res) => {
    try {
        const newDoc = await Model.create(req.body);
            if (!doc) {
            return res.status(404).json({
                status: 'failed',
                message: `Something went wrong`
            });
        }
        res.status(201).json({
            status: 'created successfully',
            data: {
                newDoc
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
exports.updateOne = Model => async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: 'failed',
                message: `please pass an ID to search  `
            });
        }
        const doc = await (Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ));
        if (!doc) {
            return res.status(404).json({
                status: 'Not found',
                message: `youe ID doesn't match any review `
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Something went wrong: ${error.message}`
        });
    }
}
exports.deleteOne = Model => async (req, res) => {
    try {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if(!doc){
            return res.status(404).json({
                status: 'failed',
                message: `No document found with that ID`
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'Tour deleted successfully'

        });
    } catch (error) {
        res.status(400).json({
            status: 'Failed',
            message: 'Could not delete this tour',
            error: error.message
        })
    }
}

