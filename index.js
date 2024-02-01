require('dotenv').config();
const PORT=process.env.PORT;


const express=require("express");
const memberRouter=require('./routers/member.router')


const app=express(); 



// pody barser
const body_parser=require('body-parser')
app.use(body_parser.json())


app.use("/members",memberRouter);

app.get("/",(req,res)=>{    
    res.end("server run successfully ")
})

app.listen(PORT,()=>{
    console.log("server is run and listen to port : ",PORT);
})