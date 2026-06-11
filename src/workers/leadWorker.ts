import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { generateOutreachMessage } from "../services/geminiService";
import { getIO } from "../socket";

new Worker(
  "lead-processing",
  async (job) => {
    console.log(`Processing ${job.id}`);

    const aiResponse =
      await generateOutreachMessage(
        job.data.leadName,
        job.data.company
      );

    await prisma.processedMessage.create({
      data: {
        leadId: job.data.leadId,
        inputMessage: `Lead from ${job.data.company}`,
        generatedResponse: aiResponse || "",
        status: "completed",
      },
    });

    getIO().emit("jobCompleted", {
      leadId: job.data.leadId,
      leadName: job.data.leadName,
      company: job.data.company,
    }); 

    console.log(`Completed ${job.id}`);
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);