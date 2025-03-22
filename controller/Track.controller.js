const { Track, Course, Task } = require('../mongoose.models/Track');
const member = require('../mongoose.models/member')
const asyncWrapper = require('../middleware/asyncWrapper');

const createError = require('../utils/createError')

const httpStatusText = require('../utils/httpStatusText')

// ===================== tracks ========================
const addTrack = asyncWrapper(
    async (req, res) => {
        const email = req.decoded.email;
        const committee = await member.findOne({ email }, { committee: true });
        console.log(committee);
        const { name, description } = req.body;
        const newTrack = new Track({ name, description, committee });
        await newTrack.save();
        res.status(201).json({ message: 'Track added successfully', track: newTrack });

    }
)

const getAllTracks = asyncWrapper(
    async (req, res) => {
        const AllTracks = await Track.find({},{name:1,description:1,committee:1,_id:1})
            // .populate({
            //     path: 'courses',
            //     populate: [
            //         { path: 'tasks' },
            //         { path: 'members' }
            //     ]

            // });



        res.status(200).json({ message: "get data successfully ", data: AllTracks })

    }
)

const editTrack = asyncWrapper(
    async (req, res) => {

        const { trackId } = req.params;
        const updates = req.body;
        const updatedTrack = await Track.findByIdAndUpdate(trackId, updates, { new: true });
        res.status(200).json({ message: 'Track updated successfully', track: updatedTrack });


    }
)

const deleteTrack = asyncWrapper(
    async (req, res) => {

        const { trackId } = req.params;
        await Track.findByIdAndDelete(trackId);
        res.status(200).json({ message: 'Track deleted successfully' });

    }
)



//========================courses ========================

const addCourseToTrack = asyncWrapper(
    async (req, res) => {
        const { trackId } = req.params;
        const { name, description } = req.body;
        const track = await Track.findById(trackId);
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const newCourse = new Course({
            name,
            description
        });
        await newCourse.save()
        track.courses.push(newCourse._id);
        await track.save();
        res.status(201).json({ message: 'Course added successfully', track });
    }
)

const getCoursesOfTrack = asyncWrapper(
    async (req, res) => {

        const id = req.params.id;
        const track = await Track.findById(id)
            // .populate({
            //     path: 'courses',
            //     populate: [
            //         { path: 'tasks' },
            //         { path: 'members' }
            //     ]

            // });
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const courses = track.courses;
        // console.log(courses);

        res.status(200).json({ message: "get courses successfully ", data: courses })


    }
)

const editCourse = asyncWrapper(
    async (req, res) => {

        const { trackId, courseId } = req.params;
        const updates = req.body;
        const track = await Track.findById(trackId).populate('courses');
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const course = track.courses.find(course => course._id.toString() === courseId);

        if (!course) {
            const error = createError(404, httpStatusText.FAIL, "Course not found");
            throw error
        }

        await Course.findByIdAndUpdate(courseId, updates);

        res.status(200).json({ message: 'Course updated successfully', track });

    }
)

const deleteCourse = asyncWrapper(
    async (req, res) => {

        const { trackId, courseId } = req.params;
        const track = await Track.findById(trackId);
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const course = track.courses.find(course => course._id.toString() === courseId);
        if (!course) {
            const error = createError(404, httpStatusText.FAIL, "Course not found");
            throw error
        }

        await Course.findByIdAndDelete(courseId)

        res.status(200).json({ message: 'Course deleted successfully', track });

    }
)



//==========================Tasks============================
const addTaskToCourse = asyncWrapper(
    async (req, res) => {

        const { trackId, courseId } = req.params;
        const { name, description, time, score, materialLink, } = req.body;

        const track = await Track.findById(trackId).populate('courses');
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const course = track.courses.find(course => course._id.toString() === courseId);
        if (!course) {
            const error = createError(404, httpStatusText.FAIL, "Course not found");
            throw error
        }
        const newTask = new Task({
            name, description, time, score, materialLink
        })
        await newTask.save();
        course.tasks.push(newTask._id);
        await course.save()
        await track.save();
        res.status(201).json({ message: 'Task added successfully', track });

    }
)

const getTasksOfCourse = asyncWrapper(
    async (req, res) => {

        const { Tid, Cid } = req.params;
        console.log(Tid, Cid);
        const track = await Track.findById(Tid).populate({
            path: 'courses',
            populate: [
                { path: 'tasks' },
                { path: 'members' }
            ]

        });
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const course = track.courses.find(course => course._id.toString() === Cid);
        if (!course) {
            const error = createError(404, httpStatusText.FAIL, "Course not found");
            throw error
        }

        const tasks = course.tasks

        console.log(tasks)


        res.status(200).json({ message: "get data successfully ", data: tasks })


    }
)

const editTask = asyncWrapper(
    async (req, res) => {

        const { trackId, courseId, taskId } = req.params;
        const updates = req.body;

        const track = await Track.findById(trackId)
            .populate({
                path: 'courses',
                populate: [
                    { path: 'tasks' },
                    { path: 'members' }
                ]

            });
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const course = track.courses.find(course => course._id.toString() === courseId);
        if (!course) {
            const error = createError(404, httpStatusText.FAIL, "Course not found");
            throw error
        }
        const task = course.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            const error = createError(404, httpStatusText.FAIL, "Task not found");
            throw error
        }
        await Task.findByIdAndUpdate(taskId, updates);

        res.status(200).json({ message: 'Task updated successfully', track });

    }
)

const deleteTask = asyncWrapper(
    async (req, res) => {

        const { trackId, courseId, taskId } = req.params;

        const track = await Track.findById(trackId)
            .populate({
                path: 'courses',
                populate: [
                    { path: 'tasks' },
                    { path: 'members' }
                ]

            });
        if (!track) {
            const error = createError(404, httpStatusText.FAIL, "Track not found");
            throw error
        }
        const course = track.courses.find(course => course._id.toString() === courseId);
        if (!course) {
            const error = createError(404, httpStatusText.FAIL, "Course not found");
            throw error
        }
        const task = course.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            const error = createError(404, httpStatusText.FAIL, "Task not found");
            throw error
        }

        await Task.findByIdAndDelete(taskId);


        res.status(200).json({ message: 'Task deleted successfully', track });

    });

    



module.exports = {
    addTrack,
    editTrack,
    deleteTrack,
    addCourseToTrack,
    editCourse,
    addTaskToCourse,
    deleteCourse,
    addTaskToCourse,
    editTask,
    deleteTask,
    getAllTracks,
    getCoursesOfTrack,
    getTasksOfCourse,
}