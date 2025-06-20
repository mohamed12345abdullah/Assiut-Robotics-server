const express = require('express');
const Router = express.Router();

const taskController = require('../controller/task.controller');
const JWT = require('../middleware/jwt');
const { uploadFile, uploadFileToCloudinary } = require('../middleware/fileUpload');

// Get all tasks
Router.get('/', taskController.getAllTasks);

// Get single task by ID
Router.get('/:taskId', taskController.getTaskById);

// Create new task
Router.post('/', 
    JWT.verify,
    taskController.createTask
);

// Update task
Router.put('/:taskId',
    JWT.verify,
    taskController.updateTask
);

// Delete task
Router.delete('/:taskId',
    JWT.verify,
    taskController.deleteTask
);

// Submit task (with file upload)
Router.post('/:taskId/submit',
    JWT.verify,
    uploadFile.single('file'),
    uploadFileToCloudinary,
    taskController.submitTask
);

// Evaluate task submission
Router.post('/:taskId/evaluate/:memberId',
    JWT.verify,
    taskController.evaluateTask
);

// Get member's task submissions
Router.get('/member/:memberId/submissions',
    JWT.verify,
    taskController.getMemberSubmissions
);

module.exports = Router; 