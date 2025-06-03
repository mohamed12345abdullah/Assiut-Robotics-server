const express = require("express");
const router = express.Router();

const Visits = require("../mongoose.models/visits");
const Member = require("../mongoose.models/member");

const asyncWrapper = require("../middleware/asyncWrapper");

const httpStatusText = require("../utils/httpStatusText");

router.route("/")
    .post(asyncWrapper(async (req, res) => {
        const { ip } = req.body;

        const existVisit = await Visits.findOne({ ip });
        if (existVisit) {
            // make the max is 30 items
            if (existVisit.history.length >= 30) {
                existVisit.history.shift();
            }
            existVisit.history.push({
                visitStart: new Date(),
                visitEnd: null,
            });
            await existVisit.save();
            return res.status(200).json({
                status: httpStatusText.SUCCESS,
                data: null,
                message: "Visit successfully",
            });
        }
        const newVisit = new Visits({ ip });
        newVisit.history.push({
            visitStart: new Date(),
            visitEnd: null,
        });
        await newVisit.save();
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: null,
            message: "Visit logged successfully",
        });
    }))
    .get(asyncWrapper(async (req, res) => {
        const visits = await Visits.find();
        console.log(visits);
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: visits,
            message: "Visits fetched successfully",
        });
    }))


router.route("/members")






    .get(asyncWrapper(async (req, res) => {
        // Get members and their IPs
        const members = await Member.find({}, { email: 1, visits: 1, name: 1, role: 1 ,phoneNumber: 1, committee: 1, gender: 1 })
        .populate('visits').populate('visits.history');
        
    
        // console.log(members);
        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: members,
            message: "Members fetched successfully",
        });
    }))    

module.exports = router;