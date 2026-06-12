import { Router } from "express";
import { leadQueue } from "../queue/leadQueue";
import { prisma } from "../db/prisma";

const router = Router();

router.post("/process", async (req, res) => {
  const { leadName, company } = req.body;

  const lead = await prisma.lead.create({
    data: {
      name: leadName,
      company,
    },
  });

  const job = await leadQueue.add("new-lead", {
    leadId: lead.id,
    leadName,
    company,
  });

  res.json({
    success: true,
    jobId: job.id,
    leadId: lead.id,
  });
});
  router.get("/jobs", async (req, res) => {
    const jobs = await prisma.processedMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 1000,
      include: {
        lead: true,
      },
    });

    res.json(jobs);
  });

router.post("/simulate-load", async (req, res) => {
  const jobs = [];

  for (let i = 1; i <= 50; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Test Lead ${i}`,
        company: `Company ${i}`,
      },
    });

    jobs.push(
      leadQueue.add("load-test", {
        leadId: lead.id,  
        leadName: lead.name,
        company: lead.company,
        isLoadTest: true,
        })
      );
    }

   await Promise.all(jobs);

    res.json({
      success: true,
      queued: 50,
    });
});

export default router;