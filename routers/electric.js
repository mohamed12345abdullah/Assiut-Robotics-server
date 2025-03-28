const express = require("express");
const Router = express.Router();


// member operations
Router.post("/addMember", );

Router.delete("/deleteMember", );

Router.put("/updateMember", );

Router.get("/getAllMembers", );

Router.get("/getMemberById", );



// add assistant
Router.post("/addAssistant", );

Router.delete("/deleteAssistant", );

Router.put("/updateAssistant", );

Router.get("/getAllAssistants", );

Router.get("/getAssistantById", );


// admin operations

Router.post("/changeAdmin", );


// electric Track operations

// add electric Track
Router.post("/addTrack", );

// update electric Track
Router.put("/updateTrack", );

// delete electric Track
Router.delete("/deleteTrack", );

// get all electric Tracks
Router.get("/getAllTracks", );

// get electric Track by id
Router.get("/getTrackById", );

// electric Course operations

// add electric Course
Router.post("/addCourse", );

// update electric Course
Router.put("/updateCourse", );

// delete electric Course
Router.delete("/deleteCourse", );

// get all electric Courses
Router.get("/getAllCourses", );

// get electric Course by id
Router.get("/getCourseById", );




// electric Task operations

// add electric Task
Router.post("/addTaskTocourse", );

// update electric Task
Router.put("/updateTaskOfCourse", );

// delete electric Task
Router.delete("/deleteTaskOfCourse", );

// get all electric Tasks
Router.get("/getAllTasksOfCourse", );

// get electric Task by id
Router.get("/getTaskById", );






module.exports = Router;