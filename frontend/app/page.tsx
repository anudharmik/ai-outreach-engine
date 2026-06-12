"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface JobData {
  leadId: string;
  leadName: string;
  company: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobData[]>([]);

  useEffect(() => {
    const loadJobs = async () => {
      const response = await fetch(
        "http://localhost:5000/api/jobs"
      );

      const data = await response.json();

      const formatted = data.map((item: any) => ({
        leadId: item.lead.id,
        leadName: item.lead.name,
        company: item.lead.company,
      }));

      setJobs(formatted);
    };

    loadJobs();

    const socket = io("http://localhost:5000");

    socket.on("jobCompleted", (data: JobData) => {
      setJobs((prev) => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="min-h-screen p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          AI Outreach Engine
        </h1>

        <p className="mb-6 text-gray-600">
          Real-time completed jobs
        </p>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="border rounded-lg p-4">
              No completed jobs yet...
            </div>
          ) : (
            jobs.map((job, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 shadow-sm"
              >
                <p>
                  <strong>Name:</strong> {job.leadName}
                </p>

                <p>
                  <strong>Company:</strong> {job.company}
                </p>

                <p>
                  <strong>Lead ID:</strong> {job.leadId}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}