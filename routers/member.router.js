const express = require("express");

const memberController = require("../controller/member.controller");
const JWT = require("../middleware/jwt");
const Router = express.Router();
const { uploadImage, uploadImageToCloudinary } = require("../middleware/fileUpload");
const otp = require("../utils/otp");

// Profile image upload using new unified system
Router.route("/changeProfileImage").post(
    uploadImage.single("image"),
    uploadImageToCloudinary,
    JWT.verify, 
    memberController.changeProfileImage
);

Router.route("/register").post(memberController.register);

Router.route("/verifyEmail/:token").get(
    JWT.verify,
    memberController.verifyEmail
);

Router.route("/getAllMembers").get(memberController.getAllMembers);

Router.route("/login").post(memberController.login);

Router.route("/verify").get(JWT.verify, memberController.verify);
// Router.route("/verify").post(JWT.verify, memberController.verify);

Router.route("/confirm").post(JWT.verify, memberController.confirm);

Router.route("/generateOTP").post(memberController.generateOTP);

Router.route("/verifyOTP").post(memberController.verifyOTP);

Router.route("/changePassword").post(memberController.changePass);

Router.route("/get/:com").get(memberController.getCommittee)

Router.route("/changeHead").post(JWT.verify, memberController.changeHead);

Router.route("/hr").post(JWT.verify, memberController.controlHR);

Router.route("/verifyOTP").post(otp.verifyOtp);

Router.route("/changePass").post(memberController.changePass);

Router.route("/rate").post(JWT.verify, memberController.rate);

// const Member = require("../mongoose.models/member");

Router.route("/:memberId/addTask").post(JWT.verify,memberController.addTask)

Router.route("/:memberId/editTask/:taskId").put(JWT.verify,memberController.editTask)

Router.route("/:memberId/deleteTask/:taskId").delete(JWT.verify,memberController.deleteTask )

Router.post("/members/:memberId/rateTask/:taskId",JWT.verify,memberController.rateMemberTask);

const { google } = require('googleapis');
const stream = require('stream');

// إعداد المصادقة مع Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: ['https://www.googleapis.com/auth/drive.file']
});
  
const drive = google.drive({ version: 'v3', auth });

// Use the new file upload system for task submissions
const { uploadFile } = require("../middleware/fileUpload");

Router.put("/submitMemberTask/:taskId",JWT.verify,
    uploadFile.single('file'), 
    async (req, res,next) => {
        try {
          if (!req.file) {
            return next()
          }
      
          const FOLDER_ID = '1-3RpVbXCnwd67h06CLTjTgU0VRUa_dSE'; 

          const fileMetadata = {
            name: req.file.originalname,
            parents: [FOLDER_ID]
          };
      
          const bufferStream = new stream.PassThrough();
          bufferStream.end(req.file.buffer);
      
          const media = {
            mimeType: req.file.mimetype,
            body: bufferStream
          };
      
          const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
          });
      
          const fileId = response.data.id;
          const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

          req.fileId=fileId;
          req.fileUrl=fileUrl;
          next()
        } catch (error) {
          console.error( error.message);
          res.status(500).send(error.message);
        }
      },
    memberController.submitMemberTask);

Router.post("/update-tasks-evaluation", memberController.updateTaskEvaluations);

Router.get("/sendFeedBack/:memberId/:token", memberController.generateFeedBack);

Router.post("/sendFeedBackEmail/:memberId", memberController.sendEmailFeedBack);

module.exports = Router;
