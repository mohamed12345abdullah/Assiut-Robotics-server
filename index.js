require('dotenv').config();
const PORT=process.env.PORT;



const express=require("express");
const memberRouter=require('./routers/member.router')
const blogRouter=require('./routers/blog.router')
const componentRouter=require('./routers/component.router')


//cors

const cors=require('cors');

const app=express(); 


//middlle wares

// pody barser
const body_parser=require('body-parser');
app.use(body_parser.json());
app.use("/",body_parser.urlencoded({extended:false}))


app.use(cors()); 

app.use("/",express.static(__dirname+"/views"))
app.use("/uploads",express.static(__dirname+"/uploads"))
app.use("/members",memberRouter);
app.use('/blogs',blogRouter)
app.use('/components',componentRouter)
// app.use("")
app.get("/",(req,res)=>{    
    res.end("server run successfully ")
})


// const multer  = require('multer')
// const upload = multer({ dest: 'uploads/' })
// app.post('/profile', upload.single('avatar'), function (req, res, next) {
//     res.end('uploaded')
//     // req.file is the `avatar` file
//     // req.body will hold the text fields, if there were any
//   })
app.listen(PORT,()=>{
    console.log("server is run and listen to port : ",PORT);
})