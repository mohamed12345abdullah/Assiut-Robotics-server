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
    const today = new Date();
    
    const startD = new Date(today);
    startD.setDate(today.getDate() - 1);
    startD.setHours(0, 0, 0, 0);
    
    const endD = new Date(today);
    endD.setDate(today.getDate() + 6);
    endD.setHours(23, 59, 59, 999);

    // أولاً، دعنا نجلب كل المواعيد للتحقق


    // ثم نجرب البحث بتاريخ البداية فقط
    const lapDates= await LapDate.find({
        startDate: { $gte: startD, $lte: endD }
    }).populate({
        path: 'member',
        select: 'name email phoneNumber avatar committee -_id'
    });
    


    res.status(200).json({
        message: httpStatusText.SUCCESS, 
        lapDates: lapDates
    });
})



module.exports = { createLapDate, getLapDate };
