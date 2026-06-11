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

export default router;