# AI Outreach Engine

A real-time event-driven AI processing system built with Express, BullMQ, Redis, PostgreSQL, Prisma, Gemini, Socket.IO, and Next.js.

## Architecture

```text
                 ┌───────────────────┐
                 │ Next.js Dashboard │
                 └─────────┬─────────┘
                           │
                           ▼
                    Socket.IO Events
                           ▲
                           │
┌─────────────┐     ┌──────┴──────┐
│ Express API │────►│ BullMQ Queue │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    Redis Queue
                           │
                           ▼
                  Background Worker
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
      Gemini AI                  Mock Processor
            │                             │
            └──────────────┬──────────────┘
                           ▼
                    PostgreSQL
                           │
                           ▼
                       Prisma
```

## Features

* Real-time dashboard updates using Socket.IO
* Background job processing using BullMQ
* Redis-backed queue architecture
* Gemini-powered outreach generation
* Load testing with simulated jobs
* Persistent job history
* Date-grouped job monitoring dashboard
* PostgreSQL + Prisma data layer

## Tech Stack

* Next.js
* Express.js
* BullMQ
* Redis
* PostgreSQL
* Prisma
* Socket.IO
* Gemini API
* TypeScript

```
```
