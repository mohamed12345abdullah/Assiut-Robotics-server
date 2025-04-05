const Meeting = require("../mongoose.models/meeting");
const Member = require("../mongoose.models/member");
const asyncWrapper = require("../middleware/asyncWrapper");


const createMeeting = asyncWrapper(async (req, res) => {
    

    const {title, members}=req.body;
    const email=req.decoded.email;
    const member = await Member.findOne({ email });
    if (!member) {
        return res.status(404).json({ status: 404, message: "Member not found" });
    }
    let tableOfDates=[];
    for(let i=0;i<7;i++){
        let day=[];
        for(let j=8;j<24;j++){
            day.push({
                time: `${j}:00`,
                isBooked: false,
                bookedBy: []
            });
        }
        tableOfDates.push(day);
    }
    const meeting=new Meeting({
        title,
        tableOfDates,
        members,
        createdBy: member._id
    })
    await meeting.save();
    res.status(201).json({ status: 201, data: meeting });
})

const getMeetings = asyncWrapper(async (req, res) => {
    const email=req.decoded.email;
    const member = await Member.findOne({ email });
    if (!member) {
        return res.status(404).json({ status: 404, message: "Member not found" });
    }
    const meetings = await Meeting.find({})
    .populate('createdBy', 'name _id avatar')
    .populate('members', 'name _id avatar');
    res.status(200).json({ status: 200, data: meetings });
});


const getMeetingById = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
        return res.status(404).json({ status: 404, message: "Meeting not found" });
    }
    res.status(200).json({ status: 200, data: meeting });
});



const bookMeeting = asyncWrapper(async (req, res) => {
    const {meetingId } = req.params;
    const email = req.decoded.email;
    const member = await Member.findOne({ email });
    if (!member) {
        return res.status(404).json({ status: 404, message: "Member not found" });
    }
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        return res.status(404).json({ status: 404, message: "Meeting not found" });
    }

    // let validateMember = false;
    // meeting.members.forEach(ele => {
    //     if (ele._id == member._id) {
    //         validateMember = true;
    //     }
    // });
    // if (!validateMember) {
    //     return res.status(400).json({ status: 400, message: "Member is not allowed to book this meeting" });
    // }
    const {timeId} = req.body;
    console.log("timeId",timeId);
    let Date = null;
    meeting.tableOfDates.forEach(day => {
        day.forEach(date => {
            console.log("date",date);
            if (date._id == timeId) {
                Date = date;
            }
        });
    });
    
    if (!Date) {
        return res.status(404).json({ status: 404, message: "Time not found" });
    }
    console.log("Date",Date);
    Date.isBooked = true;
    Date.bookedBy.push(member._id);
    await meeting.save();

    res.status(200).json({ status: 200, data: meeting });
});




module.exports={
    createMeeting,
    getMeetings,
    getMeetingById,
    bookMeeting
}



