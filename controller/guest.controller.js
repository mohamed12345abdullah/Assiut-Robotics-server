


const Guest = require("../mongoose.models/guest");

const asyncHandler = require("../middleware/asyncWrapper");

const viewUser = asyncHandler(async (req, res) => {
    const {ip,page}= req.body;

    const guest = await Guest.findOne({ip})
    if (!guest) {
        const newGuest = await Guest.create({ip,views:[{page,count:1}]})
        return res.status(200).json({
            success: true,
            message: 'تم إضافة المستخدم بنجاح'
        });
    }
    
    const view = guest.views.find((view) => view.page === page);
    if (view) {
        view.count++;
    } else {
        guest.views.push({ page, count: 1 });
    }
    await guest.save();
    res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات المستخدم بنجاح'
    });
});


const getViews = asyncHandler(async (req, res) => {
    // get the sum of views for all pages
    const allViews = await Guest.aggregate([
        {
            $unwind: "$views"
        },
        {
            $group: {
                _id: "$views.page",
                count: { $sum: "$views.count" }
            }
        }
    ]);
    const views = allViews.map((view) => ({
        page: view._id,
        count: view.count
    }));
    console.log(views); 
   
    const gests = await Guest.find({});
    console.log(gests.length);


    res.status(200).json({
        success: true,
        views,
        noOfGuests:gests.length,
        guests:gests
    });
});

module.exports = {
    viewUser,
    getViews
}
