
const express=require('express')
//cors

const app=express()


// app.get("/", async
// })


// const committeeRouter = require('./routers/committee.router');
// app.use('/api/committees', committeeRouter);

const loggerMiddleware = require("./middleware/loggerMiddleware");

app.use(loggerMiddleware);

app.use("/",(req,res)=>{
    res.status(200).json({status:200, message:"server is busy untill finish the upgrade"})
})

app.use("*", (req, res, next) => {
  res.status(404).json({ status: 404, message: "not found Api" });
})





app.use((error, req, res, next) => {

  console.log(error.message);
  
  res.status(error.statusCode || 500).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message
  })
})





app.listen(PORT||3000, () => {
  console.log("server is run and listen to port : ", `http://localhost:${PORT}/`);
})
