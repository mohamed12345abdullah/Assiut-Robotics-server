const express = require('express');
const Router = express.Router();

const personController = require('../controller/person.controller');
const JWT = require('../middleware/jwt');
const { uploadImage, uploadImageToCloudinary } = require('../middleware/fileUpload');

// Get all people
Router.get('/', personController.getAllPeople);

// Get single person by ID
Router.get('/:personId', personController.getPersonById);

// Create new person (with avatar upload)
Router.post('/', 
    JWT.verify,
    uploadImage.single('avatar'),
    uploadImageToCloudinary,
    personController.createPerson
);

// Update person (with avatar upload)
Router.put('/:personId',
    JWT.verify,
    uploadImage.single('avatar'),
    uploadImageToCloudinary,
    personController.updatePerson
);

// Delete person
Router.delete('/:personId',
    JWT.verify,
    personController.deletePerson
);

// Add tag to person
Router.post('/:personId/tags',
    JWT.verify,
    personController.addTag
);

// Remove tag from person
Router.delete('/:personId/tags/:tag',
    JWT.verify,
    personController.removeTag
);

// Get people by role
Router.get('/role/:role', personController.getPeopleByRole);

// Get people by tags
Router.get('/tags/:tags', personController.getPeopleByTags);

module.exports = Router; 