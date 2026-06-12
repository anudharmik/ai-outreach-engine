import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { generateOutreachMessage } from "../services/geminiService";
import { getIO } from "../socket";

new Worker(
  "lead-processing",
  async (job) => {
    console.log(`Processing ${job.id}`);

    let aiResponse = "";

    if (job.data.isLoadTest) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      aiResponse = `Mock outreach generated for ${job.data.company}`;

      getIO().emit("jobCompleted", {
        leadId: job.data.leadId,
        leadName: job.data.leadName,
        company: job.data.company,
        generatedResponse: aiResponse,
        status: "completed",
      });

      console.log(`Completed Load Test ${job.id}`);

      return;
    }

    aiResponse = await generateOutreachMessage(
      job.data.leadName,
      job.data.company
    );

    await prisma.processedMessage.create({
      data: {
        leadId: job.data.leadId,
        inputMessage: `Lead from ${job.data.company}`,
        generatedResponse: aiResponse,
        status: "completed",
      },
    });

    getIO().emit("jobCompleted", {
      leadId: job.data.leadId,
      leadName: job.data.leadName,
      company: job.data.company,
      generatedResponse: aiResponse,
      status: "completed",
    });

    console.log(`Completed ${job.id}`);
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
    concurrency: 5,
  }
);