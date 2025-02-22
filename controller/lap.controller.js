const LapDate = require('../mongoose.models/lapDate');
const Member = require('../mongoose.models/member');
const asyncWrapper = require('../middleware/asyncWrapper');
const createError = require('../utils/createError');
const httpStatusText = require('../utils/httpStatusText');
const createLapDate = asyncWrapper(async (req, res) => {
    const email=req.decoded.email;
    const member=await Member.findOne({email});
    if(!member){
        const error=createError(404,httpStatusText.FAIL,"Member not found");
        throw error;
    }
    const memberId=member._id;
    const { startDate, endDate } = req.body;
    const lapDate = new LapDate({ startDate, endDate, member:memberId });
    await lapDate.save();
    res.status(201).json({message:httpStatusText.SUCCESS,lapDate});
})

const getLapDate = asyncWrapper(async (req, res) => {   
    // حساب بداية ونهاية الأسبوع الحالي
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 3); // يرجع لبداية الأسبوع (الأحد)
    startOfWeek.setHours(0, 0, 0, 0); // يضبط الوقت على بداية اليوم

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 3); // يذهب لنهاية الأسبوع (السبت)
    endOfWeek.setHours(23, 59, 59, 999); // يضبط الوقت على نهاية اليوم

    const lapDate = await LapDate.find({
        startDate: { $gte: startOfWeek, $lte: endOfWeek }
    }).populate({
        path: 'member',
        select: 'name email phoneNumber avatar committee -_id'
    });
    
    res.status(200).json({message:httpStatusText.SUCCESS,lapDate});
})



module.exports = { createLapDate, getLapDate };
