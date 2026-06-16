"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type JobStatus = "completed" | "failed" | "processing" | "queued" | string;
type SocketState = "connecting" | "connected" | "disconnected";
type StatTone = "blue" | "emerald" | "purple" | "amber";

interface JobData {
  leadId: string;
  leadName: string;
  company: string;
  generatedResponse?: string;
  status?: JobStatus;
  createdAt?: string;
  isLoadTest?: boolean;
}

interface ApiJob {
  generatedResponse?: string | null;
  status?: JobStatus;
  createdAt?: string;
  isLoadTest?: boolean;
  lead: {
    id: string;
    name: string;
    company: string;
  };
}

interface JobGroup {
  key: string;
  label: string;
  jobs: JobData[];
  timestamp: number;
}

interface StatCardProps {
  label: string;
  value: number;
  caption: string;
  tone: StatTone;
  icon: "layers" | "calendar" | "spark" | "load";
}

const iconPaths = {
  layers: "M4 7.5 12 3l8 4.5-8 4.5-8-4.5Zm0 5 8 4.5 8-4.5M4 17.5l8 4.5 8-4.5",
  calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
  load: "M5 12a7 7 0 0 1 11.9-5M19 12a7 7 0 0 1-11.9 5M17 4v4h-4M7 20v-4h4",
  activity: "M4 12h4l2-6 4 12 2-6h4",
  chevron: "m9 6 6 6-6 6",
  server: "M5 5h14v6H5V5Zm0 8h14v6H5v-6Zm3-5h.01M8 16h.01",
};

const pipelineSteps = [
  "API request",
  "BullMQ queue",
  "Redis",
  "Worker",
  "Gemini",
  "PostgreSQL",
  "Socket.IO",
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: keyof typeof iconPaths;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function toDateKey(dateValue?: string) {
  return new Date(dateValue ?? 0).toLocaleDateString();
}

function getDateLabel(dateKey: string) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateKey === today.toLocaleDateString()) {
    return "Today";
  }

  if (dateKey === yesterday.toLocaleDateString()) {
    return "Yesterday";
  }

  return dateKey;
}

function formatTime(dateValue?: string) {
  if (!dateValue) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function formatDate(dateValue?: string) {
  if (!dateValue) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

function normalizeApiJob(item: ApiJob): JobData {
  return {
    leadId: item.lead.id,
    leadName: item.lead.name,
    company: item.lead.company,
    generatedResponse: item.generatedResponse ?? undefined,
    status: item.status,
    createdAt: item.createdAt,
    isLoadTest: item.isLoadTest ?? false,
  };
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "emerald" | "purple" | "amber";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function DashboardHeader({
  socketState,
  latestJob,
}: {
  socketState: SocketState;
  latestJob?: JobData;
}) {
  const isConnected = socketState === "connected";

  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">Event-driven AI processing engine</p>
        <h1>AI Outreach Engine</h1>
        <p className="hero-copy">
          Real-time visibility into queued lead processing, AI generation,
          persistence, and live Socket.IO delivery.
        </p>
      </div>

      <aside className="live-card" aria-live="polite">
        <div className={`live-pill ${isConnected ? "online" : "offline"}`}>
          <span />
          {isConnected ? "Live system" : "Connecting"}
        </div>
        <div>
          <strong>{latestJob ? latestJob.leadName : "Awaiting jobs"}</strong>
          <p>
            {latestJob
              ? `${latestJob.company} completed at ${formatTime(
                  latestJob.createdAt
                )}`
              : "Historical jobs load first, then completions stream in."}
          </p>
        </div>
      </aside>
    </header>
  );
}

function StatCard({ label, value, caption, tone, icon }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-icon">
        <Icon name={icon} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value.toLocaleString()}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}

function PipelinePanel({
  latestJob,
  isLoading,
}: {
  latestJob?: JobData;
  isLoading: boolean;
}) {
  return (
    <section className="pipeline-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">System flow</p>
          <h2>Processing pipeline</h2>
        </div>
        <Badge>Realtime</Badge>
      </div>

      <div className="pipeline-list">
        {pipelineSteps.map((step, index) => (
          <div className="pipeline-step" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="activity-card">
        <Icon name="activity" />
        <div>
          <p>Today&apos;s activity</p>
          <strong>
            {isLoading
              ? "Loading job history"
              : latestJob
              ? `${latestJob.leadName} processed`
              : "No completed jobs yet"}
          </strong>
          <span>
            {latestJob
              ? `${latestJob.isLoadTest ? "Load test" : "AI job"} for ${
                  latestJob.company
                }`
              : "Run a simulation to populate the stream."}
          </span>
        </div>
      </div>
    </section>
  );
}

function JobCard({ job }: { job: JobData }) {
  const isLoadTest = Boolean(job.isLoadTest);
  const status = job.status || "completed";

  return (
    <article className="job-card">
      <div className="job-card-header">
        <div className="job-badges">
          <Badge tone={isLoadTest ? "amber" : "purple"}>
            {isLoadTest ? "Load Test" : "AI Job"}
          </Badge>
          <Badge tone={status === "completed" ? "emerald" : "neutral"}>
            {status}
          </Badge>
        </div>
        <time dateTime={job.createdAt}>{formatTime(job.createdAt)}</time>
      </div>

      <div className="job-fields">
        <div>
          <span>Lead</span>
          <strong>{job.leadName}</strong>
        </div>
        <div>
          <span>Company</span>
          <strong>{job.company}</strong>
        </div>
        <div>
          <span>Created</span>
          <strong>{formatDate(job.createdAt)}</strong>
        </div>
      </div>

      <div className="output-block">
        <div className="output-header">
          <span>Generated Output</span>
          <span>{job.generatedResponse ? "generated" : "empty"}</span>
        </div>
        <pre>
          {job.generatedResponse ||
            "No response was returned for this processed job."}
        </pre>
      </div>
    </article>
  );
}

function DateGroup({
  group,
  isExpanded,
  onToggle,
}: {
  group: JobGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const aiCount = group.jobs.filter((job) => !job.isLoadTest).length;
  const loadCount = group.jobs.length - aiCount;

  return (
    <section className={`date-group ${isExpanded ? "expanded" : ""}`}>
      <button className="date-group-button" onClick={onToggle} type="button">
        <div className="date-heading">
          <span className="chevron">
            <Icon name="chevron" />
          </span>
          <div>
            <h3>
              {group.label} <span>({group.jobs.length.toLocaleString()} jobs)</span>
            </h3>
            <p>
              {aiCount} AI jobs / {loadCount} load tests
            </p>
          </div>
        </div>
        <span className="date-count">{group.jobs.length}</span>
      </button>

      <div className="date-group-content" aria-hidden={!isExpanded}>
        <div className="date-group-inner">
          {group.jobs.map((job, index) => (
            <JobCard
              job={job}
              key={`${job.leadId}-${job.createdAt ?? index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="state-card">
      <div className="skeleton-line wide" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  );
}

function EmptyState({ onSimulate }: { onSimulate: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="server" />
      </div>
      <h3>No completed jobs yet</h3>
      <p>
        Submit a lead through the API or run a load simulation to watch jobs
        arrive in real time.
      </p>
      <button className="primary-button" onClick={onSimulate} type="button">
        Simulate 50 Jobs
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketState, setSocketState] = useState<SocketState>("connecting");

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/jobs`);

        if (!response.ok) {
          throw new Error("Unable to load historical jobs.");
        }

        const data = (await response.json()) as ApiJob[];
        const formatted = data.map(normalizeApiJob);

        if (isMounted) {
          setJobs(formatted);
          setExpandedDate(
            formatted[0] ? toDateKey(formatted[0].createdAt) : null
          );
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadJobs();

    const socket = io(API_URL);

    socket.on("connect", () => setSocketState("connected"));
    socket.on("disconnect", () => setSocketState("disconnected"));
    socket.on("connect_error", () => setSocketState("disconnected"));

    socket.on("jobCompleted", (data: JobData) => {
      const incomingJob = {
        ...data,
        isLoadTest: data.isLoadTest ?? false,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };

      setExpandedDate(toDateKey(incomingJob.createdAt));
      setJobs((previousJobs) => [incomingJob, ...previousJobs]);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const groupedJobs = useMemo<JobGroup[]>(() => {
    const groups = jobs.reduce<Record<string, JobData[]>>((acc, job) => {
      const key = toDateKey(job.createdAt);
      acc[key] = acc[key] ? [...acc[key], job] : [job];
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([key, groupJobs]) => ({
        key,
        label: getDateLabel(key),
        jobs: groupJobs,
        timestamp: new Date(groupJobs[0]?.createdAt ?? 0).getTime(),
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [jobs]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todaysJobs = jobs.filter((job) => toDateKey(job.createdAt) === today);
    const loadTestJobs = jobs.filter((job) => job.isLoadTest);
    const aiJobs = jobs.filter((job) => !job.isLoadTest);

    return {
      totalJobs: jobs.length,
      todaysJobs: todaysJobs.length,
      aiJobs: aiJobs.length,
      loadTestJobs: loadTestJobs.length,
    };
  }, [jobs]);

  const latestJob = jobs[0];

  const simulateLoad = async () => {
    try {
      setIsSimulating(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/simulate-load`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to start load simulation.");
      }
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : "Unable to start load simulation."
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <main className="dashboard-shell">
      <div className="dashboard-grid" />
      <div className="dashboard-container">
        <DashboardHeader latestJob={latestJob} socketState={socketState} />

        <section className="stats-grid" aria-label="Job statistics">
          <StatCard
            caption="Persisted completed jobs"
            icon="layers"
            label="Total Jobs"
            tone="blue"
            value={stats.totalJobs}
          />
          <StatCard
            caption="Completed since midnight"
            icon="calendar"
            label="Today's Jobs"
            tone="emerald"
            value={stats.todaysJobs}
          />
          <StatCard
            caption="Gemini-generated outreach"
            icon="spark"
            label="AI Jobs"
            tone="purple"
            value={stats.aiJobs}
          />
          <StatCard
            caption="Synthetic throughput runs"
            icon="load"
            label="Load Test Jobs"
            tone="amber"
            value={stats.loadTestJobs}
          />
        </section>

        <div className="main-layout">
          <PipelinePanel isLoading={isLoading} latestJob={latestJob} />

          <section className="jobs-panel">
            <div className="section-title">
              <div>
                <p className="eyebrow">Completed stream</p>
                <h2>Job timeline</h2>
              </div>
              <button
                className="primary-button"
                disabled={isSimulating}
                onClick={simulateLoad}
                type="button"
              >
                {isSimulating ? "Queueing..." : "Simulate 50 Jobs"}
              </button>
            </div>

            {error ? <div className="error-banner">{error}</div> : null}

            {isLoading ? (
              <LoadingState />
            ) : groupedJobs.length === 0 ? (
              <EmptyState onSimulate={simulateLoad} />
            ) : (
              <div className="date-groups">
                {groupedJobs.map((group) => (
                  <DateGroup
                    group={group}
                    isExpanded={expandedDate === group.key}
                    key={group.key}
                    onToggle={() =>
                      setExpandedDate((current) =>
                        current === group.key ? null : group.key
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
