"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface JobData {
  leadId: string;
  leadName: string;
  company: string;
  generatedResponse?: string;
  status?: string;
  createdAt?: string;
  isLoadTest?: boolean;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobData[]>([]);

  const groupedJobs = jobs.reduce(
  (acc: Record<string, JobData[]>, job) => {
    const date = new Date(
      job.createdAt || Date.now()
    ).toLocaleDateString();

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(job);

    return acc;
  },{});

  const [expandedDate, setExpandedDate] =useState<string | null>(null);

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
        generatedResponse: item.generatedResponse,
        status: item.status,
        createdAt: item.createdAt,
        isLoadTest: item.isLoadTest,
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

  const totalJobs = jobs.length;
  const today = new Date().toLocaleDateString();

  const todaysJobs = jobs.filter(
    (job) =>
      new Date(
        job.createdAt || Date.now()
      ).toLocaleDateString() === today
  );

  const loadTestJobs = jobs.filter(
    (job) => job.isLoadTest
  );

  const aiJobs = jobs.filter(
    (job) => !job.isLoadTest
  );



  return (
    <main className="min-h-screen p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          AI Outreach Engine
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold">{totalJobs}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Today's Jobs</p>
          <p className="text-2xl font-bold">{todaysJobs.length}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">AI Jobs</p>
          <p className="text-2xl font-bold">{aiJobs.length}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Load Test Jobs</p>
          <p className="text-2xl font-bold">{loadTestJobs.length}</p>
        </div>
      </div>

        <p className="mb-6 text-gray-600">Real-time completed jobs</p>

      <button
        onClick={async () => {
          await fetch(
            "http://localhost:5000/api/simulate-load",
            {
              method: "POST",
            }
          );
        }}
        className="bg-black text-white px-4 py-2 rounded mb-6"
      >
        Simulate 50 Jobs
      </button>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="border rounded-lg p-4">
              No completed jobs yet...
            </div>
          ) : (
            Object.entries(groupedJobs).map(
          ([date, dateJobs]) => (
            <div
              key={date}
              className="border rounded p-4 mb-4"
            >
              <button
                onClick={() =>
                  setExpandedDate(
                    expandedDate === date
                      ? null
                      : date
                  )
                }
              >
                {expandedDate === date ? "▼" : "▶"}{" "}
                {date} ({dateJobs.length} jobs)
              </button>

              {expandedDate === date && (
                <div className="mt-4 space-y-4">
                  {dateJobs.map((job, index) => (
                    <div
                      key={index}
                      className="border p-4 rounded"
                    >
                      <p>
                        <strong>Type:</strong>{" "}
                        {job.isLoadTest
                          ? "Load Test"
                          : "AI Job"}
                      </p>

                      <p>
                        <strong>Name:</strong>{" "}
                        {job.leadName}
                      </p>

                      <p>
                        <strong>Company:</strong>{" "}
                        {job.company}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {job.status}
                      </p>

                      <p>
                        <strong>AI Response:</strong>
                      </p>

                      <p>{job.generatedResponse}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
          )
          )}
        </div>
      </div>
    </main>
  );
}