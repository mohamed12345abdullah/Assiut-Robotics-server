const express = require("express");

const memberController = require("../controller/member.controller");
const JWT = require("../middleware/jwt");
const Router = express.Router();
const multer = require("multer");
const otp = require("../utils/otp");


const { uploadToCloud } = require("../utils/cloudinary");


// const diskStorage = multer.diskStorage({
//         destination: (req, file, cb) => {
//                 cb(null, "books/");
//         },
//         filename: (req, file, cb) => {
//                 const ext = file.mimetype.split("/")[1];
//                 const filename = `${file.originalname}_.${ext}`;
//                 console.log("file", file);

//                 cb(null, filename);
//         },
// });

// const fileFilter = (req, file, cb) => {
//         const imageType = file.mimetype.split("/")[1];
//         if (imageType == "img") {
//                 return cb(null, true);
//         } else {
//                 return cb("I don't have a clue!", false);
//         }
// };
// const upload = multer({
//         storage: diskStorage,
//         fileFilter,
// });



// Multer configuration

const cloudinary = require('cloudinary').v2;


// Configure Cloudinary

cloudinary.config({
    cloud_name:"dlxwpay7b",
    secure:true,
    api_key:"957197717412299",
    api_secret:"Pv53x9A3EkgBa3b_1H7O1Wu_sWc"
});

// Set up multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const imageType = file.mimetype.split("/")[1];
        if (imageType === "jpg" || imageType === "jpeg" || imageType === "png") {
            return cb(null, true); // Only allow JPG and PNG files
        } else {
            return cb(new Error("Only images (jpg, jpeg, png) are allowed!"), false);
        }
    }
});

Router.route("/changeProfileImage").post(
    upload.single("image"),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }

            // Upload image to Cloudinary directly from memory
            const result = await cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                if (error) {
                    return res.status(500).json({ message: 'Error uploading image', error: error.message });
                }
                req.imageUrl = result.secure_url;
                console.log("Uploaded to Cloudinary");
                next();
            }).end(req.file.buffer);

        } catch (error) {
            res.status(500).json({ message: 'Error uploading image', error: error.message });
        }
    },JWT.verify, memberController.changeProfileImage
);



// Multer middleware
// const upload = multer({
//     storage: diskStorage,
//     fileFilter,
// });




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

Router.put("/submitMemberTask/:taskId",JWT.verify,
    

    upload.single('file'), async (req, res,next) => {
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
            body: bufferStream // الآن هو Stream
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
        //   res.status(200).json({
        //     fileId,
        //     fileUrl,
        //     message: 'تم الرفع بنجاح!'
        //   });
        } catch (error) {
          console.error( error.message);
          res.status(500).send(error.message);
        }
      },
    
    
    
    memberController.submitMemberTask);

Router.post("/update-tasks-evaluation", memberController.updateTaskEvaluations);









// استخدام multer مع التخزين في الذاكرة (RAM)
// const upload = multer({ storage: multer.memoryStorage() });

// معرف المجلد في Google Drive
// const FOLDER_ID = '1PiT2qfepsNUBmCGTXVCWv3ZP62aC3G1Y'; // استبدلها بمجلدك

// API لرفع الملفات إلى Google Drive
// app.post('/upload', upload.single('file'), async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).send('لم يتم رفع أي ملف.');
//       }
  
//       const fileMetadata = {
//         name: req.file.originalname,
//         parents: [FOLDER_ID]
//       };
  
//       const media = {
//         mimeType: req.file.mimetype,
//         body: Buffer.from(req.file.buffer) // استخدام Buffer بدلاً من ReadStream
//       };
  
//       const response = await drive.files.create({
//         resource: fileMetadata,
//         media: media,
//         fields: 'id'
//       });
  
//       const fileId = response.data.id;
//       const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
//       res.status(200).json({
//         fileId,
//         fileUrl,
//         message: 'تم الرفع بنجاح!'
//       });
//     } catch (error) {
//       console.error('خطأ أثناء رفع الملف:', error);
//       res.status(500).send('حدث خطأ أثناء رفع الملف.');
//     }
//   });

// app.listen(PORT, () => {
//   console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
// });




module.exports = Router;
