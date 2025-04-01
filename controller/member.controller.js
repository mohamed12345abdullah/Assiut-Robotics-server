require("dotenv").config();
const MONGOURL = process.env.MONGOURL;
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);
const member = require("../mongoose.models/member");
const Visits = require("../mongoose.models/visits");

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


// const deleteVisits = async () => {
//     let i=1;
//     const members = await member.find();
//     members.forEach(async (member) => {
//         member.visits = [];
//         await member.save();
//         console.log(`member ${i} saved`);
//         i++;
//     })
//     console.log("Visits deleted successfully");
// }

// deleteVisits();


const test =()=>{
    console.log("test");
    let now=Date.now()

    now=new Date(now)
    let end=new Date("2025-03-27")
    console.log(now);
    console.log(end);
    console.log(now > end);
}

// test();
const htmlContent_ofVrify = fs.readFileSync(filePath, "utf-8");
const register = asyncWrapper(async (req, res, next) => {


    if(Date.now() > new Date("2025-03-27")){
        const error = createError(400, httpStatusText.FAIL, "Registration is closed")
        throw (error);
    }
    let { name, email, password, committee, gender, phoneNumber } = req.body;
    let oldEmail = await member.findOne({ email });
    if (oldEmail && oldEmail.verified) {
        // console.log("old member", oldEmail);

        const error = createError(400, httpStatusText.FAIL, "This email is already exist. Please log in or use a different email.")
        throw (error);
    }
    if (oldEmail) {

        const generateToken = jwt.generateToken()
        const token = await generateToken({ email }, "48h");
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
    const { email, password, remember,ip } = req.body;
    const oldMember = await member.findOne({ email })
 
   
    // console.log(oldMember);

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

    // check if the ip is already in the visits array
    const visit = await Visits.findOne({ ip }, { _id: 1 });
    if(!visit){
        const newVisit = new Visits({ ip });
        await newVisit.save();
        oldMember.visits.push(newVisit._id);
    }else{
        if(!oldMember.visits.includes(visit._id)){
            oldMember.visits.push(visit._id);
        }
    }


    await oldMember.save();
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { token: token, memberData: oldMember },
        message: "Your are logged in",
    });


});

const getAllMembers = asyncWrapper(async (req, res) => {

    let members = await member.find({}, { password: false })

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
console.log("imageUrl",req.imageUrl)

    if (!req.imageUrl) {
        const error = createError(404, httpStatusText.SUCCESS, "image Url not found ")
        throw (error)

    }
    oldMember.avatar = req.imageUrl;
    await oldMember.save();
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null,
        message: "profile image is changed successfully",
    });
})













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

const generateEvaluationEmail = (data) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Evaluation Report</title>
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
    
        body {
            background: #f0f0f0;
            padding: 20px;
        }
    
        .report-card {
            background: white;
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ccc;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    
        .header {
            background: #00A7E1;
            color: white;
            padding: 15px;
        }
    
        .logo-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
    
        .logo {
            width: 80px;
            height: auto;
            display: none; /* إخفاء اللوجوه في الهواتف */
        }
    
        .title {
            text-align: center;
            order: 2;
        }
    
        .title h1 {
            font-size: 20px;
            margin-bottom: 5px;
        }
    
        .title h2 {
            font-size: 16px;
            font-weight: normal;
        }
    
        .profile {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            border-bottom: 2px solid #00A7E1;
            align-items: center;
        }
    
        .photo-frame {
            width: 100px;
            height: 100px;
            border: 2px solid #00A7E1;
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00A7E1;
            font-weight: bold;
            font-size: 40px;
        }
    
        .info {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            font-size: 16px;
            text-align: center;
            width: 100%;
        }
    
        .info span {
            font-weight: bold;
        }
    
        .evaluation-section {
            padding: 20px;
        }
    
        .evaluation-section h2 {
            text-align: center;
            font-size: 20px;
            margin-bottom: 20px;
            position: relative;
        }
    
        .evaluation-section h2::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 2px;
            background: #00A7E1;
        }
    
        .metrics {
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-top: 30px;
        }
    
        .metric {
            text-align: center;
        }
    
        .circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            margin: 0 auto 10px;
            background: conic-gradient(
                #00A7E1 0% ${data.tasksDeadline}%,
                #f0f0f0 ${data.tasksDeadline}% 100%
            );
        }
    
        .metric:nth-child(2) .circle {
            background: conic-gradient(
                #00A7E1 0% ${data.behavior}%,
                #f0f0f0 ${data.behavior}% 100%
            );
        }
    
        .metric:nth-child(3) .circle {
            background: conic-gradient(
                #00A7E1 0% ${data.groupInteraction}%,
                #f0f0f0 ${data.groupInteraction}% 100%
            );
        }
    
        .circle-inner {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    
        .percentage {
            font-size: 20px;
            font-weight: bold;
            color: #00A7E1;
        }
    
        .check {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 20px;
            height: 20px;
            background: #00A7E1;
            border-radius: 50%;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 12px;
        }
    
        .performance {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            margin-top: 20px;
            align-items: center;
        }
    
        .gauge-section {
            text-align: center;
            margin: 0;
            width: 100%;
            max-width: 300px;
        }
        
        .gauge-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 50%; /* نسبة العرض إلى الارتفاع */
            margin: 0 auto;
        }
        
        .gauge {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, #ff4d4d 0%, #ffdd4d 50%, #4dff4d 100%);
            border-radius: 50% 50% 0 0 / 100% 100% 0 0;
            overflow: hidden;
        }
        
        .scale {
            position: absolute;
            top: 10%;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 15%;
            font-size: 20px;
            z-index: 2;
        }
        
        .pointer {
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 3px;
            height: 50%;
            background: #333;
            transform: rotate(${data.technicalPerformance * 1.8 - 90}deg);
            transform-origin: bottom center;
            z-index: 3;
        }
        
        .gauge-label {
            margin-top: 15px;
        }
        
        .gauge-label .value {
            color: #00A7E1;
            font-size: 20px;
            font-weight: bold;
            margin-top: 5px;
        }
    
        .total {
            background: #00A7E1;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            width: 100%;
            max-width: 200px;
        }
    
        .total h3 {
            font-size: 18px;
            margin-bottom: 10px;
        }
    
        .total .score {
            font-size: 36px;
            font-weight: bold;
        }
    
        .awards {
            padding: 20px;
            border-top: 2px solid #00A7E1;
        }
    
        .awards h2 {
            text-align: center;
            font-size: 20px;
            margin-bottom: 20px;
            position: relative;
        }
    
        .awards h2::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 2px;
            background: #00A7E1;
        }
    
        .award-slots {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
            margin-top: 20px;
        }
    
        .slot {
            min-height: 80px;
            border: 2px solid #00A7E1;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            text-align: center;
            background-color: #f5f5f5;
        }
    
        /* وسائط الاستعلام للشاشات المتوسطة والكبيرة */
        @media (min-width: 600px) {
            .logo-section {
                flex-direction: row;
                justify-content: space-between;
            }
            
            .logo {
                display: block;
                width: 100px;
            }
            
            .title {
                order: unset;
            }
            
            .profile {
                flex-direction: row;
                align-items: flex-start;
                text-align: left;
            }
            
            .info {
                text-align: left;
            }
            
            .metrics {
                flex-direction: row;
                justify-content: space-around;
            }
            
            .performance {
                flex-direction: row;
                justify-content: space-around;
                align-items: center;
            }
            
            .award-slots {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    
        @media (min-width: 768px) {
            .title h1 {
                font-size: 24px;
            }
            
            .title h2 {
                font-size: 18px;
            }
            
            .photo-frame {
                width: 150px;
                height: 150px;
                font-size: 60px;
            }
            
            .circle {
                width: 120px;
                height: 120px;
            }
            
            .circle-inner {
                width: 100px;
                height: 100px;
            }
            
            .percentage {
                font-size: 24px;
            }
        }
        </style>
    </head>
    <body>
        <div class="report-card">
            <div class="header">
                <div class="logo-section">
                    <img src="https://i.ibb.co/VxmYBdm/logo.png" alt="Company Logo" class="logo">
                    <div class="title">
                        <h1>Evaluation Report</h1>
                        <h2>${data.monthYear || 'March 2025'}</h2>
                    </div>
                    <img src="https://i.ibb.co/VxmYBdm/logo.png" alt="Company Logo" class="logo">
                </div>
            </div>
    
            <div class="profile">
                <div class="photo-frame">${data.name.charAt(0)}</div>
                <div class="info">
                    <p><span>Name:</span> ${data.name}</p>
                    <p><span>Committee:</span> ${data.committee}</p>
                    <p><span>Role:</span> ${data.role}</p>
                </div>
            </div>
    
            <div class="evaluation-section">
                <h2>Evaluation Metrics</h2>
                <div class="metrics">
                    <div class="metric">
                        <div class="circle">
                            <div class="circle-inner">
                                <div class="percentage">${data.tasksDeadline}%</div>
                            </div>
                            ${data.tasksDeadline >= 90 ? '<div class="check">✓</div>' : ''}
                        </div>
                        <p>Tasks at deadline</p>
                    </div>
                    <div class="metric">
                        <div class="circle">
                            <div class="circle-inner">
                                <div class="percentage">${data.behavior}%</div>
                            </div>
                            ${data.behavior >= 90 ? '<div class="check">✓</div>' : ''}
                        </div>
                        <p>Behavior</p>
                    </div>
                    <div class="metric">
                        <div class="circle">
                            <div class="circle-inner">
                                <div class="percentage">${data.groupInteraction}%</div>
                            </div>
                            ${data.groupInteraction >= 90 ? '<div class="check">✓</div>' : ''}
                        </div>
                        <p>Group interaction</p>
                    </div>
                </div>
            </div>
    
            <div class="performance">
                <div class="gauge-section">
                    <div class="gauge-container">
                        <div class="gauge">
                            <div class="scale">
                                <span>😠</span>
                                <span>😐</span>
                                <span>😊</span>
                            </div>
                            <div class="pointer"></div>
                        </div>
                    </div>
                    <div class="gauge-label">
                        <p>Technical performance level</p>
                        <p class="value">${data.technicalPerformance}%</p>
                    </div>
                </div>
    
                <div class="total">
                    <h3>Total<br>Evaluation %</h3>
                    <div class="score">${data.total}%</div>
                </div>
            </div>
    
            <div class="awards">
                <h2>Awards of the month</h2>
                <div class="award-slots">
                    ${data.awards.map(award => `<div class="slot">${award || ''}</div>`).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};


  // مثال لاستخدام الدالة
  const evaluationData = {
    name: "Afnan Zakaria",
    committee: "Media - design",
    role: "Member",
    monthYear: "March 2025",
    tasksDeadline: 95,
    behavior: 100,
    groupInteraction: 100,
    technicalPerformance: 75,
    total: 97,
    awards: ["Best Designer", "Team Player", "Innovator"]
  };
  
//   console.log(generateEvaluationEmail(evaluationData));

const JWT= require('jsonwebtoken');


const generateFeedBack = asyncWrapper(async (req, res) => {
    const { memberId } = req.params;
    const Member = await member.findById(memberId);

    if (!Member) {
        return res.status(404).json({ message: "Member not found" });
    }

    const data= await JWT.verify(req.params.token, process.env.SECRET);
    console.log("data", data);
    if(!data){
        return res.status(400).json({ message: "Invalid data" });
    }
    

    const evaluationTemplate = fs.readFileSync(path.join(__dirname, '../public/evaluation-template.html'), 'utf8');

    // Function to replace template values with actual data
    
    // Your data object
    const evaluationData = {
        name: Member.name,
        committee: data.committee,
        role: Member.role,
        tasksDeadline: data.tasksDeadline,
        behavior: data.behavior,
        groupInteraction: data.groupInteraction,
        technicalPerformance: data.technicalPerformance,
        total: data.total,
        awards: data.awards
    };
    
    // Generate the populated template
    const populatedTemplate = generateEvaluationEmail(evaluationData);
    

    res.end(populatedTemplate);
    // Now you can use populatedTemplate (send it in response, save to file, etc.)

    // await sendEmail({
    //     email: Member.email,
    //     subject: 'Evaluation Report',
    //     text: 'Evaluation Report',
    //     html: populatedTemplate
    // });

    // res.status(200).json({ message: "Evaluation report sent successfully" });
    
})

const notificationFeedback=async(memberId, token)=>{
    return  `
        <html> 
        <head></head>
        <body>
            <h1>Feedback Notification</h1>
            <p>you have received a feedback!</p>


            <div class="feedback">
                <h2>Feedback</h2>
                <p>click on the link to show your feedback</p>
            </div>

            <a href="https://assiut-robotics-zeta.vercel.app/members/sendFeedBack/${memberId}/${token}">View Feedback</a>
        </body> 
        </html>
    `
}


const sendEmailFeedBack=asyncWrapper(async (req, res) => {
    const memberId=req.params.memberId;
    if(!memberId){
        return res.status(400).json({ message: "Invalid member id" });
    }
    const Member=await member.findById(memberId);
    if(!Member){
        return res.status(404).json({ message: "Member not found" });
    }
    const data=req.body;
    console.log("data", data);
    if(!data){
        return res.status(400).json({ message: "Invalid data" });
    }
    const evaluationData = {
        name: Member.name,
        committee: data.committee,
        role: Member.role,
        tasksDeadline: data.tasksDeadline,
        behavior: data.behavior,
        groupInteraction: data.groupInteraction,
        technicalPerformance: data.technicalPerformance,
        total: data.total,
        awards: data.awards
    };

        const generateToken = jwt.generateToken()
        const token = await generateToken( evaluationData);
    await sendEmail({
        email: Member.email,
        subject: 'Feedback',
        text: 'Feedback',
        html: await notificationFeedback(memberId, token)
    })

    res.status(200).json({ message: "Feedback sent successfully" });

}   )


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
    updateTaskEvaluations,
    generateFeedBack,
    sendEmailFeedBack
};






