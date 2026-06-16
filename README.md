# Datadog SSI Demo

## Demo architecture

This demo runs two containers with Docker Compose:

- `api`: a NestJS 11 Task Manager API running on Node v26.
- `datadog-agent`: the Datadog Agent with APM, log collection, and Single Step Instrumentation enabled.

The API has no Datadog SDK dependency and no tracing code. It exposes simple task endpoints, writes structured JSON logs to stdout, and sends traffic to the Agent through `DD_AGENT_HOST=datadog-agent`.

## Prerequisites

- Docker
- Docker Compose
- A valid `DD_API_KEY`

## Running the demo

```sh
cp .env.example .env
```

Edit `.env` and fill in `DD_API_KEY`.

```sh
docker compose up --build
```

## Demo script

```sh
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-06-16T12:00:00.000Z"}

curl http://localhost:3000/tasks
# [{"id":"...","title":"Prepare demo environment","description":"Confirm Docker and Datadog credentials are ready.","status":"pending","createdAt":"..."}]

curl "http://localhost:3000/tasks?slow=true"
# Same task array after an artificial 1500ms delay.

curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Create visible APM trace","description":"Call the API from curl."}'
# {"id":"...","title":"Create visible APM trace","description":"Call the API from curl.","status":"pending","createdAt":"..."}

curl http://localhost:3000/tasks/<task-id>
# {"id":"<task-id>","title":"...","description":"...","status":"pending","createdAt":"..."}

curl http://localhost:3000/tasks/missing-id
# {"error":"Task not found","id":"missing-id"}

curl -X DELETE http://localhost:3000/tasks/<task-id> -i
# HTTP/1.1 204 No Content

curl -X DELETE "http://localhost:3000/tasks/<task-id>?fail=true"
# {"statusCode":500,"message":"Simulated task deletion failure","error":"Internal Server Error"}
```

## Why there's no dd-trace

The point of this demo is to prove that the application image does not need Datadog tracing packages or tracing imports. The Datadog Agent is configured for Single Step Instrumentation, which loads the Datadog Node.js tracing library into supported Node.js processes at runtime. That runtime injection model is the same idea Datadog uses with its Kubernetes admission controller: instrumentation is added by deployment infrastructure, not by application source code.

Because the tracer is injected outside the app, `package.json`, `package-lock.json`, and `src/` stay free of `dd-trace`. The application only exposes standard NestJS HTTP routes and structured stdout logs; the Agent is responsible for collecting traces and container logs and sending them to Datadog.