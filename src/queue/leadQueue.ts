import { Queue } from "bullmq";

export const leadQueue = new Queue("lead-processing", {
  connection: {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: {},  
},  
});