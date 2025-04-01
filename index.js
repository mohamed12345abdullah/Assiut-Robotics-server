require('dotenv').config();
const PORT = process.env.PORT;


const express = require("express");
const memberRouter = require('./routers/member.router')
const blogRouter = require('./routers/blog.router')
const componentRouter = require('./routers/component.router')
const lapDateRouter=require('./routers/lapDates.js')
const visitRouter=require('./routers/visit.js')
// status text
const httpStatusText = require('./utils/httpStatusText');

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

// apis for borrow and return
// borrow api is :  /components/borrow
// return api is : /components/return



app.use("/lapDates",lapDateRouter);


app.use("/visitor",visitRouter);
// app.get("/", async
// })

const electricRouter = require('./routers/electric');
app.use("/electric", electricRouter);

// const committeeRouter = require('./routers/committee.router');
// app.use('/api/committees', committeeRouter);

const loggerMiddleware = require("./middleware/loggerMiddleware");

app.use(loggerMiddleware);





app.get('/webhook', (req, res) => {
  // ضع هنا verify token اللي هتختاره (مثلاً: MY_VERIFY_TOKEN)
  const VERIFY_TOKEN = "assiut_robotics_123";
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }else{
    res.status(400).json({ status: 400,data:{
      mode,
      token,
      challenge
    }, message: "Invalid parameters" });
  }
});

// إعداد endpoint لاستقبال بيانات الـ Webhook (POST)
app.post('/webhook', (req, res) => {
  try {
    const body = req.body;
    
    // تأكد من أن الحدث من صفحة
    if (body.object === 'page') {
      body.entry.forEach(entry => {
        console.log('Received webhook event:', JSON.stringify(entry, null, 2)); // طباعة الـ entry كاملة

        // معالجة البيانات الخاصة بالـ feed
        if (entry.messaging) {
          console.log('Received messaging event:', JSON.stringify(entry.messaging, null, 2));
          entry.messaging.forEach(event => {
            if (event.message && event.message.text) {
              console.log('Received message:', event.message.text);
              // هنا تقدر تعالج وتحفظ البيانات في قاعدة البيانات
            }

            // إضافة رياكشنات أو تعليقات
            if (event.reaction) {
              console.log('Received reaction:', event.reaction);
              // هنا تقدر تعالج وتحفظ بيانات الرياكشن
            }
            
            if (event.comment) {
              console.log('Received comment:', event.comment);
              // هنا تقدر تعالج وتحفظ بيانات التعليق
            }
          });
        }
      });

      // الرد لفيسبوك إن الحدث استُلم
      res.status(200).send('EVENT_RECEIVED');
    } 
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});


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
