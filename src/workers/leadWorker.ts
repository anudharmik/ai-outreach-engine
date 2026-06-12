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
      console.log("LOAD TEST:", job.data.company);
      await new Promise((resolve) =>
        setTimeout(resolve, 1000));

      aiResponse = `Mock outreach generated for ${job.data.company}`;
    } else {
      console.log("GEMINI:", job.data.company);
      aiResponse = await generateOutreachMessage(
        job.data.leadName,
        job.data.company
      );
    }

    await prisma.processedMessage.create({
      data: {
        leadId: job.data.leadId,
        inputMessage: `Lead from ${job.data.company}`,
        generatedResponse: aiResponse,
        status: "completed",
        isLoadTest: job.data.isLoadTest ?? false,
      },
    });

    getIO().emit("jobCompleted", {
      leadId: job.data.leadId,
      leadName: job.data.leadName,
      company: job.data.company,
      generatedResponse: aiResponse,
      status: "completed",
      createdAt: new Date().toISOString(),
      isLoadTest: job.data.isLoadTest ?? false,
    });

    console.log(`Completed ${job.id}`);
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
    concurrency: 20,
  }
);
