const express = require("express");
const Router = express.Router();

const Admin = require('../mongoose.models/electric').AdminSchema;
const Assistant = require('../mongoose.models/electric').AssistantSchema;
const electricController = require('../controller/electric.controller');


// maka validation middleware
const adminValidate = (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ status: 400, message: "Admin email is required" });
    }
    const admin = Admin.findOne({ email });
    if (!admin) {
        return res.status(404).json({ status: 404, message: "Admin not found" });
    }
    next();
}

const assistantValidate = (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ status: 400, message: "Assistant email is required" });
    }
    const assistant = Assistant.findOne({ email });
    if (!assistant) {
        return res.status(404).json({ status: 404, message: "Assistant not found" });
    }
    next();
}

// student operations
Router.post("/addStudent",adminValidate, assistantValidate, );

Router.delete("/deleteStudent",adminValidate, assistantValidate, );

Router.put("/updateStudent",adminValidate, assistantValidate, );

Router.get("/getAllStudents", );

Router.get("/getStudentById",adminValidate, assistantValidate, );



// add assistant
Router.post("/addAssistant",adminValidate, );

Router.delete("/deleteAssistant",adminValidate, );

Router.put("/updateAssistant",adminValidate, );

Router.get("/getAllAssistants",adminValidate, );

Router.get("/getAssistantById",adminValidate, );


// admin operations

Router.post("/changeAdmin",adminValidate, );


// electric Track operations

// add electric Track
Router.post("/addTrack", electricController.addTrack);

// update electric Track
Router.put("/updateTrack", electricController.updateTrack);

// delete electric Track
Router.delete("/deleteTrack", electricController.deleteTrack);

// get all electric Tracks
Router.get("/getAllTracks",electricController.getTracks );

// get electric Track by id
Router.get("/getTrackById", );

// electric Course operations

// add electric Course
Router.post("/addCourse",adminValidate, assistantValidate, );

// update electric Course
Router.put("/updateCourse",adminValidate, assistantValidate, );

// delete electric Course
Router.delete("/deleteCourse",adminValidate, assistantValidate, );

// get all electric Courses
Router.get("/getAllCourses", );

// get electric Course by id
Router.get("/getCourseById", );




// electric Task operations

// add electric Task
Router.post("/addTaskTocourse",adminValidate, assistantValidate, );

// update electric Task
Router.put("/updateTaskOfCourse",adminValidate, assistantValidate, );

// delete electric Task
Router.delete("/deleteTaskOfCourse",adminValidate, assistantValidate, );

// get all electric Tasks
Router.get("/getAllTasksOfCourse",);

// get electric Task by id
Router.get("/getTaskById", );






module.exports = Router;