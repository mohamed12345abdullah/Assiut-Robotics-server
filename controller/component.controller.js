require("dotenv").config();
const MONGOURL = process.env.MONGOURL;
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);
const component = require("../mongoose.models/component");
const path = require('path');
const fs = require('fs');
const sendEmail = require('../utils/sendEmail');
const cloudinary=require('../utils/cloudinary');
const { uploadToCloud } = require("../utils/cloudinary");
const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");
const Member = require("../mongoose.models/member");




const addComponent = async (req, res) => {
    try {
        const email=req.decoded.email;
        const member=await Member.findOne({email});
        if(!member){
            const error=createError(400, 'Fail',"member not found");
            throw(error);
        }
        const { title, price, taxes, ads, discount, total, category } = req.body;
        const newComponent = await new component({
            title,
            image:req.imageUrl,
            price,
            taxes,
            ads,
            discount,
            total,
            category,
            // creation:{
            //     createdBy:member._id,
            //     createdAt:Date.now()
            // }
        });

        await newComponent.save();

        res.status(200).send({ message: "add component successfully" });
    } catch (error) {
        console.log(error);
        
        res.status(400).send({ message: error.message });
    }
}; 

const getCombonent =asyncWrapper( async (req, res) => {
  
        const components = await component.find({deleted: false})

        let data=components.filter(component=>
            component.deleted === false
        );
        if(!data){
            const error=createError(400, 'Fail',"components not found");
            throw(error);
        }
        res.status(200).send({ message: "get data successfully", data: data });

});


const updateComponent = async (req, res) => {
    try {
        console.log(req.body);
        const email=req.decoded.email;
        
        const member=await Member.findOne({email});
        if(!member){
            const error=createError(400, 'Fail',"member not found");
            throw(error);
        }

        const updatedComponent = await component.findByIdAndUpdate(req.body.id, req.body.newpro);
        if(!updatedComponent){
            const error=createError(400, 'Fail',"component not found");
            throw(error);
        }
        updatedComponent.historyOfUpdate.push({
            updatedBy: member._id,
            updatedAt: Date.now()
        });
        await updatedComponent.save();

        res.status(200).send({ message: "updated" });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};



const deleteOne = async (req, res) => {
    try {
        console.log("delete one");
        const id = req.body.id;
        const email=req.decoded.email;
        const member=await Member.findOne({email});
        if(!member){
            const error=createError(400, 'Fail',"member not found");
            throw(error);
        }
        if(!id){
            const error=createError(400, 'Fail',"id is required");
            throw(error);
        }
        const mycomponent = await component.findById(id);
        if(!mycomponent){
            const error=createError(400, 'Fail',"component not found");
            throw(error);
        }
        mycomponent.deleted = true;
        mycomponent.deletedBy = member._id;
        await mycomponent.save();

        res.status(200).send({ message: "deleted" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};




// استعارة مكون


// request to borrow 

module.exports = {
    addComponent,
    getCombonent,
    updateComponent,
    deleteOne,

};
