require("dotenv").config();
const MONGOURL = process.env.MONGOURL;
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);
const member = require("../mongoose.models/member");
const { Track, Course, Task } = require('../mongoose.models/Track')

// jwt
const jwt = require("../middleware/jwt");

//bcrypt
const bcrypt = require("../middleware/bcrypt");

// http status text
const httpStatusText = require("../utils/httpStatusText");

//async wrapper
const asyncWrapper = require("../middleware/asyncWrapper");

// send email
const sendEmail = require("../utils/sendEmail");
// otp
const otp = require("../utils/otp");

const strongPassword = require("../utils/strongPass");
const createError = require("../utils/createError")

const authRole = require('../middleware/authorizeRoles')


const { decode } = require("jsonwebtoken");
const fs = require("fs")
const path = require('path');


// تحديد المسار النسبي للملف
const filePath = path.join(__dirname, '../public/verifyEmail.html');

const test = async () => {
    console.log("updateeeeeeeeeeeeeeeeeeeeeeeee")           

    // const members = await member.find();
    let i = 0;
    // const members = await member.find({  });
// console.log(members); // تأكد من وجود المستندات التي تحتوي على الحقل hrEvaluation
const result = await member.updateMany(
    { "tasks.hrEvaluation": { $exists: true } }, // التأكد من وجود الحقل
    { $unset: { "tasks.$[].hrEvaluation": '' } } // حذف الحقل من جميع المهام
  );
      console.log(result); // تأكد من النتيجة
      console.log("result is s : ",result);
    // members.forEach(async (memb) => {
    //     if (memb.name == "tset") {
    //         console.log("memberrr ", i, memb)
    //         i++;
    //         // memb.verified=true;
    //         await member.findOneAndDelete({ name: "tset" })
    //         await member.save()
    //         memb.role = "member";
    //         // await memb.save()
    //         // console.log(memb)
        // }

    // }

// )




}
// test().catch((error)=>{ 
//     console.log("error",error);  

// })

const htmlContent_ofVrify = fs.readFileSync(filePath, "utf-8");
const register = asyncWrapper(async (req, res, next) => {
    let { name, email, password, committee, gender, phoneNumber } = req.body;
    let oldEmail = await member.findOne({ email });
    if (oldEmail && oldEmail.verified) {
        // console.log("old member", oldEmail);

        const error = createError(400, httpStatusText.FAIL, "This email is already exist. Please log in or use a different email.")
        throw (error);
    }
    if (oldEmail) {
        const generateToken = jwt.generateToken()
        const token = await generateToken({ email }, "1h");
        // https://assiut-robotics-zeta.vercel.app/
        const token_url = `https://assiut-robotics-zeta.vercel.app/members/verifyEmail/${token}`
        console.log("req.body is : ", req.body);
        await sendEmail({
            email: email,
            subject: "Confirm Your Email - Assiut Robotics Team",
            text: "Verify Email",
            html: htmlContent_ofVrify.replace('{{token_url}}', token_url),
        });
        const error = createError(400, httpStatusText.FAIL, "This email is already exist. verify your email by click on the link on your email")
        throw (error);
    }
    // await member.save()
    const strong = await strongPassword(password);
    if (strong.length != 0) {
        const error = createError(400, httpStatusText.FAIL, strong)
        throw (error);
    }


    let hashedpass = await bcrypt.hashing(password);
    const newMember = new member({
        name,
        email,
        password: hashedpass,
        committee,
        gender,
        phoneNumber,
    })
    await newMember.save();
    const generateToken = jwt.generateToken()
    const token = await generateToken({ email }, "1h");
    // https://assiut-robotics-zeta.vercel.app/
    const token_url = `https://assiut-robotics-zeta.vercel.app/members/verifyEmail/${token}`
    console.log("req.body is : ", req.body);
    await sendEmail({
        email: email,
        subject: "Confirm Your Email - Assiut Robotics Team",
        text: "Verify Email",
        html: htmlContent_ofVrify.replace('{{token_url}}', token_url),
    });
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null,
        message: "verify your email by click on the link on your email ",

    });

});

const verifyEmail = asyncWrapper(async (req, res, next) => {

    let { email } = req.decoded;
    let existMember = await member.findOne({ email });
    // console.log("old member", oldEmail);
    existMember.verified = true;
    await existMember.save();
    const filePath = path.join(__dirname, '../public/response_of_verify.html');

    const htmlContent = fs.readFileSync(filePath, "utf-8");
    res.status(201).end(htmlContent);

})

const login = asyncWrapper(async (req, res) => {


    console.log("body", req.body);
    const { email, password, remember } = req.body;
    const oldMember = await member.findOne({ email })
        .populate({
            path: "startedTracks.track",
            populate: {
                path: "courses", // يملأ الكورسات داخل التراك
                populate: {
                    path: "tasks", // يملأ التاسكات داخل الكورسات
                }
            }
        })
        .populate({
            path: "startedTracks.courses.course",
            populate: {
                path: "tasks", // يملأ التاسكات داخل الكورس
            }
        })
        .populate("startedTracks.courses.submittedTasks.task");
    console.log(oldMember);

    if (!oldMember) {
        const error = createError(404, httpStatusText.FAIL, "User not Found")
        throw (error);
    }


    if (!oldMember.verified) {
        const error = createError(404, httpStatusText.FAIL, "verify your email by click on the link on your email")
        throw (error);

    }


    const truePass = await bcrypt.comparePassword(password, oldMember.password);
    if (!truePass) {
        const error = createError(400, httpStatusText.FAIL, "wrong password")
        throw (error);
    }


    if (oldMember.role == "not accepted") {
        const error = createError(401, "un authorized", "wait until your account be accepted")
        throw (error);
    }
    const generateToken = jwt.generateToken();

    const token = await generateToken({ email }, remember);

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { token: token, memberData: oldMember },
        message: "Your are logged in",
    });


});

const getAllMembers = asyncWrapper(async (req, res) => {

    let members = await member.find({}, { password: false })
    .populate({
        path: "startedTracks.track",
        populate: {
            path: "courses", // يملأ الكورسات داخل التراك
            populate: {
                path: "tasks", // يملأ التاسكات داخل الكورسات
            }
        }
    })
    .populate({
        path: "startedTracks.courses.course",
        populate: {
            path: "tasks", // يملأ التاسكات داخل الكورس
        }
    })
    .populate("startedTracks.courses.submittedTasks.task");;

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            members,
        },
        message: "get members successfully",
    });

});

const verify = asyncWrapper(async (req, res) => {
    try {
        if (req.decoded) {
            const oldMember = await member.findOne({ email: req.decoded.email }, { password: false })
                .populate({
                    path: "startedTracks.track",
                    populate: {
                        path: "courses", // يملأ الكورسات داخل التراك
                        populate: {
                            path: "tasks", // يملأ التاسكات داخل الكورسات
                        }
                    }
                })
                .populate({
                    path: "startedTracks.courses.course",
                    populate: {
                        path: "tasks", // يملأ التاسكات داخل الكورس
                    }
                })
                .populate("startedTracks.courses.submittedTasks.task");
            if (oldMember) {
                res.status(200).send({ message: "success authorization", data: oldMember });
            } else {
                res.status(401).send({ message: " unauthorized" });
            }
        }
    } catch (error) {
        res.status(401).send({ message: " unauthorized" });
    }
});
// roles {"not accepted"}
const confirm = asyncWrapper(async (req, res) => {
    const headEmail = req.decoded.email;
    const head = await member.findOne({ email: headEmail });
    if (head.role != 'head' && head.role != 'leader') {
        const error = createError(401, httpStatusText.FAIL, `Stay out of what’s not yours ya ${head.name} `)
        throw error
    }
    const { email, accepted } = req.body;
    console.log(accepted);
    const x = await member.findOne({ email, committee: head.committee });
    if (!x && head.role != 'leader') {
        const error = createError(401, httpStatusText.FAIL, `Stay out of what’s not yours ya ${head.name} `)
        throw error
    }
    if (accepted == 'false') {
        await member.findOneAndDelete({ email });
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: null,
            message: "deleted",
        });
    }
    const Member = await member.findOneAndUpdate({ email }, { role: "member" });
    if (!Member.verified) {
        const error = createError(400, httpStatusText.FAIL, "Email Not verified yet");
        throw (error)
    }
    const filePath = path.join(__dirname, '../public/accepted.html');

    const htmlContent = fs.readFileSync(filePath, "utf-8");
    await sendEmail({
        email: email,
        subject: "accepted - Assiut Robotics Team",
        text: "acception Email",
        html: htmlContent.replace('{{name}}', Member.name),
    });
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null,
        message: " accpeted ",
    });
});



const generateOTP = asyncWrapper(async (req, res, next) => {
    const { email } = req.body;

    console.log(req.body);
    let oldmember = await member.findOne({ email }, { password: false });
    if (oldmember) {
        const generateOTP = otp.generateOtp()
        const { secret, code } = await generateOTP();
        oldmember.secretKey = secret;
        await oldmember.save();
        console.log(oldmember);
        const htmlContent = fs.readFileSync(path.join(__dirname, '../public/verifyCode.html'), "utf-8");

        await sendEmail({
            email: oldmember.email,
            subject: "Reset Your Password",
            text: "Reset Your Password",
            html: htmlContent.replace("{{verification_code}}", code),
        });
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: null,
            message: "check your email ",
        });
    } else {
        const error = createError(404, httpStatusText.FAIL, "user not found")
        throw (error)

    }
});


const verifyOTP = asyncWrapper(
    async (req, res, next) => {
        // const error=createError(400,httpStatusText.FAIL,"wr" )
        // throw(error)
        const { email, code } = req.body;
        console.log(req.body);

        const oldMember = await member.findOne({ email }, { secretKey: true });

        console.log(oldMember.secretKey);

        const verifiOTP = otp.verifyOtp();
        if (await verifiOTP(oldMember.secretKey, code)) {
            res.status(200).json({
                statusCode: 200,
                statusText: httpStatusText.SUCCESS,
                message: "true otp"
            })
        }


    }
)


const changePass = asyncWrapper(async (req, res) => {

    const { email, newPassword, code } = req.body;
    const secret = member.find({ email }, { secret: true })
    const verifiOTP = otp.verifyOtp();
    const oldMember = await member.findOne({ email }, { secretKey: true });
    console.log(oldMember.secretKey);

    await verifiOTP(oldMember.secretKey, code)
    const strong = await strongPassword(newPassword);
    if (strong.length != 0) {
        const error = createError(400, httpStatusText.FAIL, strong)
        throw (error);
    }

    let hashedpass = await bcrypt.hashing(newPassword);

    const updated = await member.findOneAndUpdate({ email }, { password: hashedpass }, { password: false });
    if (updated) {
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: updated,
            message: "updated success",
        });
    } else {
        res.status(404).json({
            status: httpStatusText.FAIL,
            data: null,
            message: "this user not found",
        });
    }

});

const getCommittee = asyncWrapper(
    async (req, res, next) => {
        const com = req.params.com;
        if (!com) {
            const error = createError(400, httpStatusText.FAIL, "name of committee  required")
            throw (error)
            // return res.status(404).json({ msg: "committee not found" })
        }
        const members = await member.find({ committee: com }, { password: false });


        res.status(200).json({ message: "get committee members succesfully", date: members });
    }
)

const controlHR = async (req, res) => {
    try {
        const { id, committee } = req.body;

        await member.findByIdAndUpdate(id, { role: "HR " + committee});
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: null,
            message: "done",
        });
    } catch (error) {
        res.status(501).json({
            status: httpStatusText.ERROR,
            data: null,
            message: error.message,
        });
    }
};
const changeHead = asyncWrapper(async (req, res) => {


    const id = req.body.memberId;
    const email = req.decoded.email;
    const Member = await member.findOne({ email });
    if (Member.role != 'leader') {
        const error = createError(401, httpStatusText.FAIL, `Stay out of what’s not yours ya ${Member.name} `)
        throw error
    }
    // await member.findOneAndUpdate({ _id: old_id }, { role: 4 });
    const newHead = await member.findOne({ _id: id });
    const committee = newHead.committee
    const oldHead = await member.findOne({ committee, role: "head" });

    if (oldHead) {
        if (oldHead.email == newHead.email) {
            return res.status(200).json({ message: "the same head" })
        }
        oldHead.role = "member";
        await oldHead.save()
    }

    newHead.role = "head";
    // const members=await member.find({committee},{role:"head"})
    // await members.save()
    // const newHead = await member.findOneAndUpdate({ _id: new_id }, { role: 2 });
    // await member.save();
    await newHead.save();
    // console.log("rund  ",committee);

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null,
        message: "done",
    });

});


const rate = async (req, res) => {
    try {
        console.log(req.decoded);
        const committee = req.decoded.committee.split("-")[0];
        console.log(committee);
        if (committee == "HR") {
            const { ID, rate } = req.body;
            const MEMBER = await member.findById(ID);
            // if(MEMBER.committee=="web"){
            //     MEMBER.rate=9.5;
            // }else{
            //     MEMBER.rate=rate;
            // }
            MEMBER.rate = rate;
            if (rate < 6) {
                MEMBER.alerts += 1;
                if (MEMBER.alerts > 2) {
                    MEMBER.warnings += 1;
                    MEMBER.alerts = 0;

                }
            }
            if (MEMBER.warnings > 2) {
                console.log("delete");
                await member.deleteOne({ _id: ID });
            }
            MEMBER.save();
            res.status(200).json({
                status: httpStatusText.SUCCESS,
                data: null,
                message: "updated success",
            });
        } else {
            res.status(401).send({
                status: httpStatusText.FAIL,
                data: null,
                message: " not HR",
            });
        }



    } catch (error) {
        res.status(400).send({
            status: httpStatusText.FAIL,
            data: null,
            message: error.message,
        });
    }
}


const changeProfileImage = asyncWrapper(async (req, res) => {

    const email = req.decoded.email;
    console.log(email);

    //  const{ID}=req.body;
    const oldMember = await member.findOne({ email });
    console.log(oldMember)
    if (!oldMember) {
        const error = createError(404, httpStatusText.SUCCESS, "user not found ")
        throw (error)

    }

    oldMember.avatar = req.imageUrl;
    oldMember.save();
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null,
        message: "profile image is changed successfully",
    });
})





const joinCourse = asyncWrapper(
    async (req, res, next) => {
        const { email } = req.decoded;
        console.log(email);

        const { trackId, courseId } = req.body;
        console.log(trackId, courseId);

        let MEMBER;
        MEMBER = await member.findOneAndUpdate(
            {
                email,
                "startedTracks.track": trackId,
                "startedTracks.courses.course": { $ne: courseId } // يتأكد أن الكورس غير موجود


            }, // نبحث عن التراك داخل المستخدم
            {
                $addToSet: { "startedTracks.$.courses": { course: courseId } } // إضافة الكورس داخل التراك المحدد
            },
            { new: true }
        )
            .populate({
                path: "startedTracks.track",
                populate: {
                    path: "courses", // يملأ الكورسات داخل التراك
                    populate: {
                        path: "tasks", // يملأ التاسكات داخل الكورسات
                    }
                }
            })
            .populate({
                path: "startedTracks.courses.course",
                populate: {
                    path: "tasks", // يملأ التاسكات داخل الكورس
                }
            })
            .populate("startedTracks.courses.submittedTasks.task");

        if (!MEMBER) {
            MEMBER = await member.findOneAndUpdate(
                {
                    email,
                    "startedTracks.track": { $ne: trackId },

                },
                {
                    $push: {
                        startedTracks: {
                            track: trackId,
                            courses: [{ course: courseId }]
                        }
                    },

                },
                { new: true }

            );
        }
        if (!MEMBER) {
            const error = createError(400, httpStatusText.FAIL, "you are already joind to this course")
            throw error
        }
        const course = await Course.findOne({ _id: courseId })
        course.members.push(MEMBER._id);
        await course.save();
        res.status(200).json({ message: "joined to course successfully", data: MEMBER });


    }
)

const submitTask = asyncWrapper(
    async (req, res, next) => {
        const { email } = req.decoded;
        console.log(email);
        const { trackId, courseId, taskId, submissionLink, submittedAt, rate, notes } = req.body;
        console.log(trackId, courseId, taskId);

        let MEMBER;
        MEMBER = await member.findOne({
            email,
            "startedTracks.courses.course": courseId,
            "startedTracks.track": trackId,
        })
        if (!MEMBER) {
            const error = createError(400, httpStatusText.FAIL, "you are not joined to this course");
            throw error
        }
        MEMBER = await member.findOneAndUpdate(
            {
                email,
                "startedTracks.track": trackId,  // ✅ تحويل إلى ObjectId
                "startedTracks.courses.course": courseId,  // ✅ تحويل إلى ObjectId
                "startedTracks.courses.submittedTasks.task": { $ne: taskId } // ✅ منع التكرار
            },
            {
                $push: {
                    "startedTracks.$[track].courses.$[course].submittedTasks": { // ✅ إضافة بيانات المهمة
                        task: taskId, // ✅ تحويل إلى ObjectId
                        submissionLink,
                        rate,
                        notes
                    }
                }
            },
            {
                new: true,
                arrayFilters: [
                    { "track.track": trackId },
                    { "course.course": courseId }
                ]
            }
        )
            .populate({
                path: "startedTracks.track",
                populate: {
                    path: "courses", // يملأ الكورسات داخل التراك
                    populate: {
                        path: "tasks", // يملأ التاسكات داخل الكورسات
                    }
                }
            })
            .populate({
                path: "startedTracks.courses.course",
                populate: {
                    path: "tasks", // يملأ التاسكات داخل الكورس
                }
            })
            .populate("startedTracks.courses.submittedTasks.task");;



        if (!MEMBER) {
            const error = createError(200, httpStatusText.FAIL, "this task is already submited")
            throw error
        }
        res.status(200).json({ message: "submitted successfully", data: MEMBER });

    }
)


const getMembersJoinedCourse = asyncWrapper(
    async (req, res, next) => {
        const courseId = req.params.courseId;

        // التحقق من أن الكورس موجود
        const course = await Course.findById(courseId).populate({
            path: "members",
            populate: {
                path: "startedTracks.track",
                populate: {
                    path: "courses",
                    populate: {
                        path: "tasks"
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({
            message: "Data retrieved successfully",
            members: course.members
        });
    }
);

const updateTaskEvaluation = async (req, res) => {
    try {
        const { memberId, taskId, submissionId } = req.params;
        const { rate, notes } = req.body;

        // البحث عن العضو بالتراك والكورس المحددين
        const Member = await member.findById(memberId);
        if (!Member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // البحث عن التراك الذي يحتوي على الكورس المحدد
        const track = Member.startedTracks.find(track =>
            track.courses.some(course => course.submittedTasks.some(task => task._id.toString() === submissionId))
        );

        if (!track) {
            return res.status(404).json({ message: 'Track not found for this member' });
        }

        // البحث عن الكورس المحدد داخل التراك
        const course = track.courses.find(c =>
            c.submittedTasks.some(task => task._id.toString() === submissionId)
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found for this member' });
        }

        // البحث عن الـ Task المحدد داخل الكورس
        const submittedTask = course.submittedTasks.find(task => task._id.toString() === submissionId);

        if (!submittedTask) {
            return res.status(404).json({ message: 'Submitted task not found' });
        }

        // تحديث التقييم والملاحظات
        submittedTask.rate = rate;
        submittedTask.notes = notes;

        // حفظ التعديلات في قاعدة البيانات
        await Member.save();

        res.status(200).json({ message: 'Task evaluation updated successfully', submittedTask });

    } catch (error) {
        console.error('Error updating task evaluation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



const addTask = asyncWrapper(
    async (req, res, next) => {
        const ID = req.params.memberId;
        const {
            deadline,
            description,
            points,
            startDate,
            taskUrl,
            title, } = req.body;
        const Member = await member.findById(ID);
        if (!Member) {
            const error = createError(404, "Member or Task not found");
            throw error;
        }

        const email = req.decoded.email;
        const admin = await member.findOne({ email })
        if (admin.role != 'leader' &&
            admin.role != 'viceLeader' &&
            (admin.role != 'head' || admin.committee != Member.committee) &&
            (admin.role != 'vice' || admin.committee != Member.committee) &&
            admin.role != `HR ${Member.committee}`
        ) {
            const error = createError(401, httpStatusText.FAIL, 'Access denied. Insufficient permissions.')
            throw error;
        }

        // let start= new Date(startDate)
        // start.setHours(0,0,0,0)
        // let end =new Date(deadline)
        // end.setHours(23,59,59,999);       

        Member.tasks.push( {
            deadline,
            description,
            points,
            startDate,
            taskUrl,
            title, });
        Member.save()
        res.status(200).json({ status: httpStatusText.SUCCESS, message: "add task successfully" })
    }
)



const editTask = asyncWrapper(
    async (req, res, next) => {
        const { taskId, memberId } = req.params;
        const {
            deadline,
            description,
            points,
            startDate,
            taskUrl,
            title, } = req.body;
            
        // console.log("body : ",req.body);
            
        const Member = await member.findById(memberId);
        const email = req.decoded.email;
        const admin = await member.findOne({ email })
        if (admin.role != 'leader' &&
            admin.role != 'viceLeader' &&
            (admin.role != 'head' || admin.committee != Member.committee) &&
            (admin.role != 'vice' || admin.committee != Member.committee) &&
            admin.role != `HR ${Member.committee}`
        ) {
            const error = createError(401, httpStatusText.FAIL, 'Access denied. Insufficient permissions.')
            throw error;
        }

        const task = Member.tasks.id(taskId);


            
        if (!task) {
            const error = createError(404, "Member or Task not found");
            throw error;
        }

        task.headEvaluation=   task.headEvaluation/(task.points*0.5) *points*0.5;
        task.deadlineEvaluation=  task.deadlineEvaluation/(task.points*0.2)    *points*0.2;
        task.rate=task.headEvaluation+task.deadlineEvaluation+0.3*points;
        task.title=title;
        task.description=description;
        task.startDate=startDate;
        task.deadline=deadline;
        task.points=points;
        task.taskUrl=taskUrl;

        
        await Member.save();

        // console.log(Member)
        // console.log(task)
        res.status(200).json({ status: httpStatusText.SUCCESS, message: "edit task successfully", memberData: Member })
    }
)



const deleteTask = asyncWrapper(
    async (req, res, next) => {
        // const { email } = req.decoded;  // البريد الإلكتروني من JWT
        const { memberId, taskId } = req.params;  // الـ memberId و taskId من الـ body

        const Member = await member.findById(memberId);
        const email = req.decoded.email;
        const admin = await member.findOne({ email })
        if (admin.role != 'leader' &&
            admin.role != 'viceLeader' &&
            (admin.role != 'head' || admin.committee != Member.committee) &&
            (admin.role != 'vice' || admin.committee != Member.committee) &&
            admin.role != `HR ${Member.committee}`
        ) {
            const error = createError(401, httpStatusText.FAIL, 'Access denied. Insufficient permissions.')
            throw error;
        }

        // البحث عن العضو مع وجود الـ taskId في قائمة الـ tasks
        const updatedMember = await member.findOneAndUpdate(
            {
                _id: memberId,
                "tasks._id": taskId
            },
            {
                $pull: { "tasks": { _id: taskId } }  // إزالة المهمة من المصفوفة
            },
            { new: true }  // لضمان إرجاع العضو بعد التحديث
        );

        if (!updatedMember) {
            const error = createError(404, "Member or Task not found");
            throw error;
        }

        res.status(200).json({
            status: "success",
            message: "Task deleted successfully",
            memberData: updatedMember
        });
    }
);


const rateMemberTask = asyncWrapper(
    async (req, res) => {
 
          
            const { headEvaluation} = req.body;
            const { taskId, memberId } = req.params;
            const email = req.decoded.email;
            const admin = await member.findOne({ email })
            const Member = await member.findOne({ _id: memberId, "tasks._id": taskId });
            if (admin.role != 'leader' &&
                admin.role != 'viceLeader' &&
                (admin.role != 'head' || admin.committee != Member.committee) &&
                (admin.role != 'vice' || admin.committee != Member.committee) &&
                admin.role != `HR ${Member.committee}`
            ) {
                const error = createError(401, httpStatusText.FAIL, 'Access denied. Insufficient permissions.')
                throw error;
            }

            if (!Member) {
                const error=createError(400,httpStatusText.FAIL,"member not found ")
                throw error;
                return res.status(404).json({ success: false, message: "المهمة أو العضو غير موجود" });
            }

            const task = Member.tasks.id(taskId);

            if (!task || typeof task.points !== "number" || task.points <= 0) {
                const error=createError(400,httpStatusText.FAIL,"pints not a number ")
                throw error;
                // return res.status(400).json({ success: false, message: "عدد النقاط غير صالح" });
            }



                task.headEvaluation = task.headPercent * task.points * headEvaluation / 10000;
                if(task.submissionDate>task.deadline){

                    const different= Math.ceil(  (task.submissionDate-task.deadline )/(1000*60*60*24)   );
                    task.deadlinePercent=20 - different*2;

                }
                task.deadlineEvaluation = task.deadlinePercent* task.points  / 100;

                task.rate=task.headEvaluation+task.deadlineEvaluation+0.3*task.points;
            await Member.save();

            res.status(200).json({ success: true, message: "تم تحديث تقييم Head بنجاح", task });

    }
)


  

const submitMemberTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { submissionUrl } = req.body;
        const email = req.decoded.email;
        const fileId=req.fileId
        const downloadUrl=req.fileUrl;

        console.log(fileId)
        console.log(downloadUrl)
        // Validate input
        if (!submissionUrl) {
            return res.status(400).json({ message: "Submission URL is required." });
        }

        // Find the member
        const Member = await member.findOne({ email });
        if (!Member) {
            return res.status(404).json({ message: "Member not found." });
        }

        // Find the task inside tasks array
        const task = Member.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Update the submission link
        task.submissionLink = submissionUrl;
        task.submissionFileId=fileId;
        task.downloadSubmissionUrl=downloadUrl;
        task.submissionDate = Date.now();

        // Save the updated member data
        await Member.save();

        res.status(200).json({ message: "Task submitted successfully.", task });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({ message: "Server error.", error: error.message });
    }
};
const updateTaskEvaluations = asyncWrapper(async (req, res) => {
    const { month, memberId, socialScore, behaviorScore, interactionScore } = req.body;

    // Validate inputs
    if (!memberId) {
        return res.status(400).json({ message: "بيانات غير صحيحة: memberId مفقود" });
    }

    if (socialScore < 0 || socialScore > 100) {
        return res.status(400).json({ message: "بيانات غير صحيحة: socialScore يجب أن يكون بين 0 و 100" });
    }

    if (behaviorScore < 0 || behaviorScore > 100) {
        return res.status(400).json({ message: "بيانات غير صحيحة: behaviorScore يجب أن يكون بين 0 و 100" });
    }

    if (interactionScore < 0 || interactionScore > 100) {
        return res.status(400).json({ message: "بيانات غير صحيحة: interactionScore يجب أن يكون بين 0 و 100" });
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "بيانات غير صحيحة: يجب أن يكون الشهر بتنسيق YYYY-MM" });
    }

    try {
        // Find the member
        const Member = await member.findById(memberId);
        if (!Member) {
            return res.status(404).json({ message: "العضو غير موجود" });
        }

        // Check if the HR evaluation for the month already exists
        let hrEvaluation = Member.hr_rate.find(rate => rate.month === month);

        if (!hrEvaluation) {
            // If it doesn't exist, create a new one
            hrEvaluation = {
                month,
                memberId,
                socialScore,
                behaviorScore,
                interactionScore
            };
            Member.hr_rate.push(hrEvaluation);
        } else {
            // If it exists, update the scores
            hrEvaluation.socialScore = socialScore;
            hrEvaluation.behaviorScore = behaviorScore;
            hrEvaluation.interactionScore = interactionScore;
        }

        // Extract year and month from the input
        const [year, monthNumber] = month.split('-').map(Number);

        // Get tasks for the given month
        const tasksForMonth = getTasksByMonth(Member, monthNumber, year);

        // Update task rates based on the new HR evaluation
        tasksForMonth.forEach(task => {
            // Calculate task rate using the formula
            task.rate = (
                (socialScore / 100 * 0.1 * task.points) +
                (behaviorScore / 100 * 0.1 * task.points) +
                (interactionScore / 100 * 0.1 * task.points) +
                task.headEvaluation +
                task.deadlineEvaluation
            );
        });

        // Save the updated member
        await Member.save();

        res.json({ message: "تم تحديث تقييمات HR بنجاح" });
    } catch (error) {
        console.error("حدث خطأ أثناء تحديث التقييمات:", error);
        res.status(500).json({ message: error.message });
    }
});

const getTasksByMonth = (member, month, year) => {
    const startOfMonth = new Date(year, month - 1, 1); // First day of the month
    const endOfMonth = new Date(year, month, 0, 23, 59, 59); // Last day of the month

    return member.tasks.filter(
        (task) => task.startDate >= startOfMonth && task.deadline <= endOfMonth
    );
};

module.exports = {
    getCommittee,
    register,
    verifyEmail,
    login,
    getAllMembers,
    verify,
    confirm,
    controlHR,
    changeHead,
    generateOTP,
    verifyOTP,
    changePass,
    rate,
    changeProfileImage,
    addTask,
    editTask,
    deleteTask,
    submitMemberTask,
    rateMemberTask,

    joinCourse,
    submitTask,
    getMembersJoinedCourse,
    updateTaskEvaluation,
    
    updateTaskEvaluations,
};






