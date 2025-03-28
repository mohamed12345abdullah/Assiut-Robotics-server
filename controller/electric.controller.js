
const { Track, Course, Student, Assistant, Admin } = require('../mongoose.models/electric');

const asyncWrapper = require('../middleware/asyncWrapper');

const addTrack = asyncWrapper(async (req, res) => {
    const { name, description } = req.body;

    const track = new Track({ name, description });
    await track.save();
    res.status(201).json({ status: 201, message: "Track added successfully" });
  
})


const updateTrack = asyncWrapper(async (req, res) => {
    const { name, description,trackId } = req.body;

    const track = await Track.findById(trackId);
    if (!track) {
        return res.status(404).json({ status: 404, message: "Track not found" });
    }
    track.name = name;
    track.description = description;
    await track.save();
    res.status(200).json({ status: 200, message: "Track updated successfully" });
})

const deleteTrack = asyncWrapper(async (req, res) => {
    const { trackId } = req.body;

    const track = await Track.findById(trackId);
    if (!track) {
        return res.status(404).json({ status: 404, message: "Track not found" });
    }
    await track.deleteOne();
    res.status(200).json({ status: 200, message: "Track deleted successfully" });
})

const getTracks = asyncWrapper(async (req, res) => {
    const tracks = await Track.find();
    res.status(200).json({ status: 200, data: tracks });
})

const getTrack = asyncWrapper(async (req, res) => {
    const { trackId } = req.body;

    const track = await Track.findById(trackId);
    if (!track) {
        return res.status(404).json({ status: 404, message: "Track not found" });
    }
    res.status(200).json({ status: 200, data: track });
})






// ================================   course apis=========================


const addCourse = asyncWrapper(async (req, res) => {
    const { name, description } = req.body;

    const course = new Course({ name, description });
    await course.save();
    res.status(201).json({ status: 201, message: "Course added successfully" });
  })


const updateCourse = asyncWrapper(async (req, res) => {
    const { name, description, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ status: 404, message: "Course not found" });
    }
    course.name = name;
    course.description = description;
    await course.save();
    res.status(200).json({ status: 200, message: "Course updated successfully" });
})  

const deleteCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ status: 404, message: "Course not found" });
    }
    await course.deleteOne();
    res.status(200).json({ status: 200, message: "Course deleted successfully" });
})

const getCourses = asyncWrapper(async (req, res) => {
    const courses = await Course.find();
    res.status(200).json({ status: 200, data: courses });
})

const getCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ status: 404, message: "Course not found" });
    }
    res.status(200).json({ status: 200, data: course });
})



// ======================= tasks apis =========================


const addTask = asyncWrapper(async (req, res) => {
    const { name, description, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ status: 404, message: "Course not found" });
    }
    const task = new Task({ name, description });
    course.tasks.push(task);
    await course.save();
    res.status(201).json({ status: 201, message: "Task added successfully" });
})

const updateTask = asyncWrapper(async (req, res) => {
    const { name, description, courseId, taskId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ status: 404, message: "Course not found" });
    }
    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json({ status: 404, message: "Task not found" });
    }
    task.name = name;
    task.description = description;
    await task.save();
    res.status(200).json({ status: 200, message: "Task updated successfully" });
})

const deleteTask = asyncWrapper(async (req, res) => {
    const { courseId, taskId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ status: 404, message: "Course not found" });
    }
    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json({ status: 404, message: "Task not found" });
    }
    await task.deleteOne();
    course.tasks.pull(taskId);
    await course.save();
    res.status(200).json({ status: 200, message: "Task deleted successfully" });
})



const getTask = asyncWrapper(async (req, res) => {
    const { taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json({ status: 404, message: "Task not found" });
    }
    res.status(200).json({ status: 200, data: task });
})






//============================== student operations =============================

const addStudent = asyncWrapper(async (req, res) => {
    const { name, email, info, trackId } = req.body;
    const student = new Student({ name, email, info });
    const track = await Track.findById(trackId);
    if (!track) {
        return res.status(404).json({ status: 404, message: "Track not found" });
    }
    track.students.push(student._id);

    // add studentId to all courses if this track
    track.courses.forEach(async (course) => {
        course.students.push(student._id);
        await course.save();
    });
    await student.save();
    await track.save();
    res.status(201).json({ status: 201, message: "Student added successfully" });
})

const updateStudent = asyncWrapper(async (req, res) => {
    const { name, email, info, studentId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ status: 404, message: "Student not found" });
    }
    student.name = name;
    student.email = email;
    student.info = info;
    await student.save();
    res.status(200).json({ status: 200, message: "Student updated successfully" });
})

deleteStudentFromTrack = asyncWrapper(async (req, res) => {
    const { trackId, studentId } = req.body;
    const track = await Track.findById(trackId);
    if (!track) {
        return res.status(404).json({ status: 404, message: "Track not found" });
    }
    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ status: 404, message: "Student not found" });
    }
    track.students.pull(studentId);

    // delete studentId from all courses in this track
    track.courses.forEach(async (course) => {
        course.students.pull(studentId);
        await course.save();
    });
    await track.save();
    res.status(200).json({ status: 200, message: "Student deleted successfully" });
})

const deleteStudent = asyncWrapper(async (req, res) => {
    const { studentId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ status: 404, message: "Student not found" });
    }
    await student.deleteOne();
    res.status(200).json({ status: 200, message: "Student deleted successfully" });
})

const getStudents = asyncWrapper(async (req, res) => {
    const students = await Student.find();
    res.status(200).json({ status: 200, data: students });
})

const getStudent = asyncWrapper(async (req, res) => {
    const { studentId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ status: 404, message: "Student not found" });
    }
    res.status(200).json({ status: 200, data: student });
})






module.exports = {
    addTrack,
    updateTrack,
    deleteTrack,
    getTracks,
    getTrack,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourses,
    getCourse,
    addTask,
    updateTask,
    deleteTask,
    getTask,
    addStudent,
    updateStudent,
    deleteStudentFromTrack,
    deleteStudent,
    getStudents,
    getStudent
}