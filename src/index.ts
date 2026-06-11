import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";

import leadRoutes from "./routes/leadRoutes";
import "./workers/leadWorker";
import { initSocket } from "./socket";

const app = express();

app.use(express.json());

app.use("/api", leadRoutes);

const server = http.createServer(app);

initSocket(server);

server.listen(5000, () => {
  console.log("Server running on port 5000");
});