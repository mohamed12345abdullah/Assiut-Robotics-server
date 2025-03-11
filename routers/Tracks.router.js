const express = require('express');
const router = express.Router();
const { Track } = require('../mongoose.models/Track');
const member = require('../mongoose.models/member')
const JWT = require('../middleware/jwt')
const TrackController = require('../controller/Track.controller')


router.get("/getAllTracks", TrackController.getAllTracks)

router.get("/getCourses/:id", TrackController.getCoursesOfTrack)

router.get("/course/:Tid/:Cid/tasks", TrackController.getTasksOfCourse)


// إضافة تراك جديد
router.post('/add', JWT.verify, TrackController.addTrack
);

// تعديل تراك
router.put('/update/:trackId', TrackController.editTrack);

// حذف تراك
router.delete('/delete/:trackId', TrackController.deleteTrack);

// إضافة كورس إلى تراك معين
router.post('/:trackId/course/add', TrackController.addCourseToTrack);

// تعديل كورس
router.put('/:trackId/course/update/:courseId', TrackController.editCourse);

// حذف كورس
router.delete('/:trackId/course/delete/:courseId', TrackController.deleteCourse);

// إضافة تاسك إلى كورس معين
router.post('/:trackId/course/:courseId/task/add', TrackController.addTaskToCourse);

// تعديل تاسك
router.put('/:trackId/course/:courseId/task/update/:taskId', TrackController.editTask);

// حذف تاسك
router.delete('/:trackId/course/:courseId/task/delete/:taskId', TrackController.deleteTask);



module.exports = router;
