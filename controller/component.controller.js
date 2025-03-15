require("dotenv").config();
const MONGOURL = process.env.MONGOURL;
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);
const component = require("../mongoose.models/component");

const cloudinary=require('../utils/cloudinary');
const { uploadToCloud } = require("../utils/cloudinary");
const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");

const addComponent = async (req, res) => {
    try {



        // if (!req.file) {
        //     return res.status(400).send('No file uploaded.');
        // }

        // // Upload image to Cloudinary using the utility function
        // const imageUrl = await uploadToCloud(req.file.path); // Passing the file path to Cloudinary

       console.log("body : : ",);

        const { title, price, taxes, ads, discount, total, category } = req.body;

        //console.log(req.file.originalname);
        // const component_image=await cloudinary.uploadToCloud(req.myFileName) ;
        // console.log("file name",req.myFileName);
        const newComponent = await new component({
            title,
            image:req.imageUrl,
            price,
            taxes,
            ads,
            discount,
            total,
            category,
        });

        await newComponent.save();

        res.status(200).send({ message: "add component successfully" });
    } catch (error) {
        console.log(error);
        
        res.status(400).send({ message: error.message });
    }
}; 

const getCombonent = async (req, res) => {
    try {
        const components = await component.find({});

        res.status(200).send({ message: "get daa sucessfully", data: components });
    } catch (error) {
        res.status(404).send({ message: "not found" });
    }
};

const updateComponent = async (req, res) => {
    try {
        console.log(req.body);
        // const {id, title,  price, taxes , ads, discount, total, category } = req.body;
        await component.findByIdAndUpdate(req.body.id, req.body.newpro);

        res.status(200).send({ message: "updated" });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};

const deleteAll = async (req, res) => {
    try {
        await component.deleteMany({});
        res.status(200).send({ message: "deleted" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

const deleteOne = async (req, res) => {
    try {
        console.log("delete one");
        const id = req.body.id;
        await component.findByIdAndDelete(id);
        res.status(200).send({ message: "deleted" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};




// استعارة مكون

const borrowComponent= asyncWrapper(async (req, res) => {
   const {componentId, borrowerName} = req.body;
   const updatedComponent = await component.findById(componentId)
   if(updatedComponent.borrowedBy!=null){
    const error=createError(400, 'Fail',"this component is already borrowed")
    throw(error)
   }
   updatedComponent.borrowedBy={
    borrowerName,
    borrowedDate:new Date(),
    returnDate:null
   }
   await updatedComponent.save();

    res.status(200).json({   message: "borrowed",data:updatedComponent });
  });
  
  // إرجاع مكون
  const returnComponent = asyncWrapper(async (req, res) => {
    const {componentId} = req.body;
    const updatedComponent = await component.findById(componentId)

    updatedComponent.borrowedBy.returnDate = new Date();
    updatedComponent.history.push(updatedComponent.borrowedBy);
    updatedComponent.borrowedBy = null;
    await updatedComponent.save();

    res.status(200).json({   message: "returned",data:updatedComponent });
  });

module.exports = {
    addComponent,
    getCombonent,
    updateComponent,
    deleteAll,
    deleteOne,
    borrowComponent,
    returnComponent
};
