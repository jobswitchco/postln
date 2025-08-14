import express from 'express';
import dbConnection from "./db.js";
const app = express();
import bodyParser from "body-parser";
import cors from 'cors';
dbConnection();
import usersOnBoard from "./routes/usersOn.js";
import agenda from "./routes/agenda.js";
import { definePublishJob } from "./routes/publishPostJob.js";
import { WebSocketServer } from 'ws';
import { streamArticles } from './routes/usersOn.js';

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

const server = http.createServer(app);

// Create WebSocket server on the same HTTP server
const wss = new WebSocketServer({ server });

// Export a function so other modules can access the WebSocket server
export function getWss() {
  return wss;
}


server.listen(8001, () => {
  console.log('Server is running on 8001');
});

agenda.on("ready", () => {
  agenda.start();
  console.log("✅ Agenda started");
});

// WebSocket server basic events (optional setup here or in separate module)
wss.on('connection', (ws) => {
  console.log('New WS connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'subscribe') {
        const { topic, region, page = 1, limit = 9 } = data;
        console.log(`Subscription request: topic=${topic}, region=${region}, page=${page}, limit=${limit}`);

        // Call streamArticles to send articles over this ws connection
        await streamArticles(ws, topic, region, page, limit);
      } else {
        // Handle other message types if needed
        console.log('Unhandled WS message type:', data.type);
      }
    } catch (err) {
      console.error('WS message error:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format or server error' }));
    }
  });

  ws.on('close', () => {
    console.log('WS connection closed');
  });
});





