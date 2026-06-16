# Datadog SSI Demo

## Demo architecture

By default, this demo runs one container with Docker Compose:

- `api`: a NestJS 11 Task Manager API running on Node v26.

The API has no Datadog SDK dependency and no tracing code. It exposes simple task endpoints, writes structured JSON logs to stdout, and sends trace traffic to a Datadog Agent running on the Linux host through `DD_AGENT_HOST=host.docker.internal`.

## Prerequisites

- Docker
- Docker Compose
- A local Linux Datadog Agent with APM and Docker Single Step Instrumentation enabled

## Running the demo

```sh
docker compose up --build --remove-orphans
```

To include Datadog source-code metadata in the built image:

```sh
DD_GIT_REPOSITORY_URL="$(git config --get remote.origin.url)" \
DD_GIT_COMMIT_SHA="$(git rev-parse HEAD)" \
docker compose up --build --remove-orphans
```

## Generating load

Run the load generator in Docker with the Compose `load` profile:

```sh
docker compose --profile load up load-generator
```

To run a short, higher-throughput burst:

```sh
LOAD_CONCURRENCY=8 LOAD_REQUEST_DELAY_MS=100 LOAD_RUN_SECONDS=60 docker compose --profile load up load-generator
```

The load generator calls `/health`, `/tasks`, `/tasks?slow=true`, creates tasks, and occasionally calls error routes so APM has a mix of normal, slow, and failed requests.

## Publishing service metadata

Service Catalog metadata is managed from `docker/service.datadog.yaml` and published by GitHub Actions.

Configure these repository settings in GitHub:

- Secret `DD_API_KEY`: Datadog API key.
- Secret `DD_APP_KEY`: Datadog application key with Software Catalog write access.
- Variable `DD_SITE`: Datadog site, for example `us5.datadoghq.com`.

The workflow validates metadata on pull requests and publishes it on pushes to `main` or manual workflow runs.

You can validate locally with:

```sh
npm ci --prefix scripts/catalog-tools
node scripts/catalog-tools/validate.mjs docker/service.datadog.yaml docker/src/docker-compose.yml
```

## Source code integration

The API image is built with Datadog source-code metadata:

- `DD_GIT_REPOSITORY_URL`
- `DD_GIT_COMMIT_SHA`
- `org.opencontainers.image.source`
- `org.opencontainers.image.revision`

The TypeScript build emits source maps, and the container runs Node.js with `--enable-source-maps` so Datadog can link stack frames and code snippets back to the repository.

## Demo script

```sh
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-06-16T12:00:00.000Z"}

curl http://localhost:3000/tasks
# [{"id":1,"title":"Prepare demo environment","description":"Confirm Docker and Datadog credentials are ready.","status":"waiting"}]

curl "http://localhost:3000/tasks?slow=true"
# Same task array after an artificial 1500ms delay.

curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Create visible APM trace","description":"Call the API from curl."}'
# {"id":4,"title":"Create visible APM trace","description":"Call the API from curl.","status":"waiting"}

curl http://localhost:3000/tasks/4
# {"id":4,"title":"Create visible APM trace","description":"Call the API from curl.","status":"waiting"}

curl http://localhost:3000/tasks/missing-id
# {"error":"Task not found","id":"missing-id"}

curl -X DELETE http://localhost:3000/tasks/4 -i
# HTTP/1.1 204 No Content

curl -X DELETE "http://localhost:3000/tasks/4?fail=true"
# {"statusCode":500,"message":"Simulated task deletion failure","error":"Internal Server Error"}
```

## Why there's no dd-trace

The point of this demo is to prove that the application image does not need Datadog tracing packages or tracing imports. The host Datadog Agent is configured for Docker Single Step Instrumentation, which loads the Datadog Node.js tracing library into supported Node.js processes at runtime. That runtime injection model is the same idea Datadog uses with its Kubernetes admission controller: instrumentation is added by deployment infrastructure, not by application source code.

Because the tracer is injected outside the app, `package.json`, `package-lock.json`, and `src/` stay free of `dd-trace`. The application only exposes standard NestJS HTTP routes and structured stdout logs; the host Agent is responsible for collecting traces and sending them to Datadog.
