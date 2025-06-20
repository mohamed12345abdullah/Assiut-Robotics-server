const express = require('express');
const Router = express.Router();

const trackController = require('../controller/track.controller');
const JWT = require('../middleware/jwt');
const { uploadImage, uploadImageToCloudinary } = require('../middleware/fileUpload');

// Get all tracks
Router.get('/', trackController.getAllTracks);

// Get single track by ID
Router.get('/:trackId', trackController.getTrackById);

// Create new track (with image upload)
Router.post('/', 
    JWT.verify,
    uploadImage.single('image'),
    uploadImageToCloudinary,
    trackController.createTrack
);

// Update track (with image upload)
Router.put('/:trackId',
    JWT.verify,
    uploadImage.single('image'),
    uploadImageToCloudinary,
    trackController.updateTrack
);

// Delete track
Router.delete('/:trackId',
    JWT.verify,
    trackController.deleteTrack
);

// Add member to track
Router.post('/:trackId/members',
    JWT.verify,
    trackController.addMemberToTrack
);

// Remove member from track
Router.delete('/:trackId/members/:memberId',
    JWT.verify,
    trackController.removeMemberFromTrack
);

// Update member progress in track
Router.put('/:trackId/members/:memberId/progress',
    JWT.verify,
    trackController.updateMemberProgress
);

module.exports = Router; 