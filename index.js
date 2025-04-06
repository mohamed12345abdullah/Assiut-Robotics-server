require('dotenv').config();
const PORT = process.env.PORT;


const express = require("express");
const memberRouter = require('./routers/member.router')
const blogRouter = require('./routers/blog.router')
const componentRouter = require('./routers/component.router')
const lapDateRouter=require('./routers/lapDates.js')
const visitRouter=require('./routers/visit.js')
const electricRouter = require('./routers/electric');
const announcementRouter = require('./routers/announcement');
const meetingRouter = require('./routers/meeting');
// status text
const httpStatusText = require('./utils/httpStatusText');
const webhookRoutes = require('./routers/webhook.router.js');


//cors

const cors = require('cors');

const app = express();
app.set('view engine', 'ejs');

//middlle wares
app.use(cors());

// pody barser
const body_parser = require('body-parser');
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));




app.use("/uploads", express.static(__dirname + "/uploads"))
app.use("/members", memberRouter);
app.use('/blogs', blogRouter);
app.use('/components', componentRouter);
app.use("/lapDates",lapDateRouter);
app.use("/visitor",visitRouter);
app.use("/electric", electricRouter);
app.use("/announcement", announcementRouter);
app.use("/meeting", meetingRouter);
app.use('/webhook', webhookRoutes);

// const committeeRouter = require('./routers/committee.router');
// app.use('/api/committees', committeeRouter);

const loggerMiddleware = require("./middleware/loggerMiddleware");

app.use(loggerMiddleware);


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





app.listen(PORT, () => {
  console.log("server is run and listen to port : ", `http://localhost:${PORT}/`);
})
