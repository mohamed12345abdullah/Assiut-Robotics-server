const express = require('express');
const Router = express.Router();

const courseController = require('../controller/course.controller');
const JWT = require('../middleware/jwt');
const { uploadImage, uploadImageToCloudinary, uploadFile, uploadFileToCloudinary } = require('../middleware/fileUpload');

// Get all courses
Router.get('/', courseController.getAllCourses);

// Get single course by ID
Router.get('/:courseId', courseController.getCourseById);

// Create new course (with image upload)
Router.post('/', 
    JWT.verify,
    uploadImage.single('image'),
    uploadImageToCloudinary,
    courseController.createCourse
);

// Update course (with image upload)
Router.put('/:courseId',
    JWT.verify,
    uploadImage.single('image'),
    uploadImageToCloudinary,
    courseController.updateCourse
);

// Delete course
Router.delete('/:courseId',
    JWT.verify,
    courseController.deleteCourse
);

// Add material to course (with file upload)
Router.post('/:courseId/materials',
    JWT.verify,
    uploadFile.single('file'),
    uploadFileToCloudinary,
    courseController.addMaterial
);

// Remove material from course
Router.delete('/:courseId/materials/:materialIndex',
    JWT.verify,
    courseController.removeMaterial
);

module.exports = Router; 