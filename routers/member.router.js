const express=require('express');

const memberControler=require("../controler/member.controler");
const JWT=require('../middlleware/jwt')
const Router=express.Router();
const multer=require('multer');



const diskStorage=multer.diskStorage({
        destination:(req,file,cb)=>{
                cb(null,"uploads/");

        },
        filename:(req,file,cb)=>{
                const ext=file.mimetype.split('/')[1];
                const filename=req.body.email+`_profile_pic.${ext}`;
                console.log('file',file);

                cb(null,filename)

        }
})

const fileFilter=(req, file ,cb)=>{
        
        
        const imageType=file.mimetype.split('/')[0];
        if(imageType=='image'){
               return cb(null,true);
        }else{
                
              return  cb( 'I don\'t have a clue!' , false)
        } 

}
const upload=multer({
        storage:diskStorage,
        fileFilter
})



Router.route("/createAccount")
        .post(upload.single('avatar'),memberControler.createAccount)

Router.route("/getAllMembers")
        .get(memberControler.getAllMembers)

Router.route("/login")
        .post(memberControler.login);

Router.route("/verify")
        .post(JWT.verify,memberControler.verify);


Router.route("/confirm")
        .post(JWT.verify, memberControler.confirm);

Router.route("/changeHead")
        .post(JWT.verify,memberControler.changeHead);


Router.route("/hr")
        .post(JWT.verify, memberControler.controleHR);

module.exports=Router;        