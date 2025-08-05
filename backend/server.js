import express from 'express';
import dbConnection from "./db.js";
const app = express();
import bodyParser from "body-parser";
import cors from 'cors';
dbConnection();
import usersOnBoard from "./routes/usersOn.js";
import agenda from "./routes/agenda.js";
import { definePublishJob } from "./routes/publishPostJob.js";
definePublishJob(agenda);
app.use(express.json());
// app.use(userAgent.express());
app.use(bodyParser.urlencoded({extended: true, limit:"50mb"}));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});



// const corsOptions = {
//   origin: 'http://localhost:4700',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
//   optionSuccessStatus: 200,
// };

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionSuccessStatus: 200,
  changeOrigin: true,
};


app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});


app.use("/usersOn", usersOnBoard);


const server = app.listen(8001, () => {
  console.log('Server is running on 8001');
});

agenda.on("ready", () => {
  agenda.start();
  console.log("✅ Agenda started");
});





