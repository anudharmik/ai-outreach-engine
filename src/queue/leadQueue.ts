import { Queue } from "bullmq";

export const leadQueue = new Queue("lead-processing", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});