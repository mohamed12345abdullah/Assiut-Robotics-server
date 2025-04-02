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
            creation:{
                createdBy:member._id,
                createdAt:Date.now()
            }
        });

        await newComponent.save();

        res.status(200).send({ message: "add component successfully" });
    } catch (error) {
        console.log(error);
        
        res.status(400).send({ message: error.message });
    }
}; 

const getCombonent =asyncWrapper( async (req, res) => {

        const components = await component.find({})
        .populate('requestToBorrow', 'name email committee  phoneNumber avatar')
        .populate('borrowedBy.member', 'name email committee  phoneNumber avatar')
        .populate('history.member', 'name email committee phoneNumber avatar') 

        if(!components){
            const error=createError(400, 'Fail',"components not found");
            throw(error);
        }
        res.status(200).send({ message: "get daa sucessfully", data: components });

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
        await mycomponent.save();

        res.status(200).send({ message: "deleted" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};




// استعارة مكون


// request to borrow 

const sendNotification =       async (memberEmail, componentId) => {
    try {
        const member = await Member.findOne({email:memberEmail});
        const updateComponent = await component.findById(componentId);
        let sendTo=[];
        const leader=await Member.find({role:'leader'},{email:1});
        leader.forEach(item => sendTo.push(item.email));
    const OC=await Member.find({committee:'OC'},{email:1});
    OC.forEach(item => sendTo.push(item.email));
    console.log(sendTo);
    let notificationEmailHtml=fs.readFileSync(path.join(__dirname, '../public/notificationRequestToBorrow.html'), 'utf8');

    // Replace placeholders with actual values
    notificationEmailHtml = notificationEmailHtml
        .replace('{{name}}', member.name)
        .replace('{{email}}', member.email)
        .replace('{{committee}}', member.committee)
        .replace('{{phoneNumber}}', member.phoneNumber)
        .replace('{{avatar}}', member.avatar)
        .replace('{{componentName}}', updateComponent.title)
        .replace('{{category}}', updateComponent.category)
        .replace('{{componentImage}}', updateComponent.image);

    sendTo.forEach(async email => {
        await sendEmail({
            email: email,
            subject: "Request to Borrow - Assiut Robotics Team",
            text: "Request to Borrow",
            html: notificationEmailHtml
        })
    })

    return;
    } catch (error) {
       return error;
        
    }
    // Send notification to member
    
}
    
 

// sendNotification('mohamed12345abdullah@gmail.com','67ad1ede84cf1154ac370b2b')



const requestToBorrow= asyncWrapper(async (req, res) => {
    const email=req.decoded.email;
    console.log(email);
    const member=await Member.findOne({email});

    console.log(member);
    
    if(!member){
        const error=createError(400, 'Fail',"member not found");
        throw(error);
    }
    const {componentId} = req.body;
    const updatedComponent = await component.findById(componentId)
    if(!updatedComponent){
        const error=createError(400, 'Fail',"component not found");
        throw(error);
    }
    if(updatedComponent.borrowedBy){
        const error=createError(400, 'Fail',"component already borrowed");
        throw(error);
    }
    if(updatedComponent.requestToBorrow){
        const error=createError(400, 'Fail',"component already requested ");
        throw(error);
    }

    sendNotification(member.email, updatedComponent._id);
    updatedComponent.requestToBorrow = member._id;
    await updatedComponent.save();
    res.status(200).json({   message: "requested",data:updatedComponent });
})

const acceptRequestToBorrow= asyncWrapper(async (req, res) => {

    const {componentId,borrowDate,deadlineDate} = req.body;
    const email=req.decoded.email;
    const member=await Member.findOne({email});
    if(!member){
        const error=createError(400, 'Fail',"member not found");
        throw(error);
    }
    if(!borrowDate || !deadlineDate){
        const error=createError(400, 'Fail',"borrowDate and deadlineDate are required");
        throw(error);
    }
    const updatedComponent = await component.findById(componentId)
    if(!updatedComponent){
        const error=createError(400, 'Fail',"component not found");
        throw(error);
    }
    if(updatedComponent.borrowedBy){
        const error=createError(400, 'Fail',"component already borrowed");
        throw(error);
    }
    if(!updatedComponent.requestToBorrow){
        const error=createError(400, 'Fail',"component not requested");
        throw(error);
    }
    updatedComponent.borrowedBy = {
        member: updatedComponent.requestToBorrow,
        borrowDate: borrowDate,
        deadlineDate: deadlineDate,
        acceptedBy: member._id
    };
    updatedComponent.requestToBorrow = null;
    await updatedComponent.save();
    res.status(200).json({   message: "accepted",data:updatedComponent });
})
    

const rejectRequestToBorrow= asyncWrapper(async (req, res) => {
    const {componentId} = req.body;
    const updatedComponent = await component.findById(componentId)
    if(!updatedComponent){
        const error=createError(400, 'Fail',"component not found");
        throw(error);
    }
    if(!updatedComponent.requestToBorrow){
        const error=createError(400, 'Fail',"component not requested");
        throw(error);
    }
    updatedComponent.requestToBorrow = null;
    await updatedComponent.save();
    res.status(200).json({   message: "rejected",data:updatedComponent });
})
  
  // إرجاع مكون
  const returnComponent = asyncWrapper(async (req, res) => {
    const {componentId} = req.body;
    const email=req.decoded.email;
    const member=await Member.findOne({email});
    if(!member){
        const error=createError(400, 'Fail',"member not found");
        throw(error);
    }
    const updatedComponent = await component.findById(componentId)

    updatedComponent.borrowedBy.returnDate = new Date();
    updatedComponent.history.push(
        {
            member: updatedComponent.borrowedBy.member,
            acceptedBy: updatedComponent.borrowedBy.acceptedBy,
            borrowDate: updatedComponent.borrowedBy.borrowDate,
            deadlineDate: updatedComponent.borrowedBy.deadlineDate,
            returnDate: updatedComponent.borrowedBy.returnDate,
            returnBy: member._id
        }
    );

    updatedComponent.borrowedBy = null;
    await updatedComponent.save();

    res.status(200).json({   message: "returned",data:updatedComponent });
  });



  // component requested

  const getRequestedComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({ requestToBorrow: { $ne: null } })
    .populate('requestToBorrow', 'name email committee  phoneNumber avatar')
    .populate('borrowedBy.member', 'name email committee  phoneNumber avatar')
    .populate('history.member', 'name email committee phoneNumber avatar') 
    res.status(200).json({ message: "get requested components successfully", data: components });
  });

  const getBorrowedComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({ borrowedBy: { $ne: null } })
    .populate('borrowedBy.member', 'name email committee  phoneNumber avatar')
    .populate('history.member', 'name email committee phoneNumber avatar') 
    if(!components){
        const error=createError(400, 'Fail',"components not found");
        throw(error);
    }
    res.status(200).json({ message: "get borrowed components successfully", data: components });
  });

  const getHistoryComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({ history: { $ne: [] } })
    .populate('history.member', 'name email committee phoneNumber avatar') 
    if(!components){
        const error=createError(400, 'Fail',"components not found");
        throw(error);
    }
    res.status(200).json({ message: "get history components successfully", data: components });
  }); 

module.exports = {
    addComponent,
    getCombonent,
    updateComponent,
    deleteOne,
    returnComponent,
    requestToBorrow,
    acceptRequestToBorrow,
    rejectRequestToBorrow,
    getRequestedComponent,
    getBorrowedComponent,
    getHistoryComponent 
};
