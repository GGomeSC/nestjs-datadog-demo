const targetUrl = process.env.TARGET_URL || 'http://api:3000';
const concurrency = Number(process.env.CONCURRENCY || 4);
const delayMs = Number(process.env.REQUEST_DELAY_MS || 250);
const runSeconds = Number(process.env.RUN_SECONDS || 0);

const startedAt = Date.now();
const stats = {
  ok: 0,
  errors: 0,
  requests: 0,
};

let stopping = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(method, path, body) {
  const response = await fetch(`${targetUrl}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000),
  });

  await response.text();
  return response.status;
}

async function waitForApi() {
  while (!stopping) {
    try {
      const status = await request('GET', '/health');
      if (status < 500) {
        console.log(`load-generator connected to ${targetUrl}`);
        return;
      }
    } catch {
      // API is still starting.
    }

    await sleep(1000);
  }
}

function nextRequest(workerId, sequence) {
  if (sequence % 25 === 0) {
    return ['DELETE', '/tasks/999999?fail=true'];
  }

  if (sequence % 15 === 0) {
    return ['GET', '/tasks/missing-id'];
  }

  if (sequence % 10 === 0) {
    return [
      'POST',
      '/tasks',
      {
        title: `Load task ${workerId}-${sequence}`,
        description: 'Created by the docker load generator.',
      },
    ];
  }

  if (sequence % 4 === 0) {
    return ['GET', '/tasks?slow=true'];
  }

  if (sequence % 2 === 0) {
    return ['GET', '/tasks'];
  }

  return ['GET', '/health'];
}

async function worker(workerId) {
  let sequence = 0;

  while (!stopping) {
    sequence += 1;
    stats.requests += 1;

    try {
      const status = await request(...nextRequest(workerId, sequence));
      if (status >= 500) {
        stats.errors += 1;
      } else {
        stats.ok += 1;
      }
    } catch (error) {
      stats.errors += 1;
      console.error(`worker=${workerId} error=${error.message}`);
    }

    await sleep(delayMs);
  }
}

function printStats() {
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const rate = (stats.requests / elapsedSeconds).toFixed(1);
  console.log(
    `requests=${stats.requests} ok=${stats.ok} errors=${stats.errors} rate=${rate}/s elapsed=${elapsedSeconds}s`,
  );
}

process.on('SIGINT', () => {
  stopping = true;
});

process.on('SIGTERM', () => {
  stopping = true;
});

async function main() {
  await waitForApi();
  console.log(
    `load-generator started concurrency=${concurrency} delay_ms=${delayMs} run_seconds=${runSeconds || 'forever'}`,
  );

  const interval = setInterval(printStats, 5000);
  const workers = Array.from({ length: concurrency }, (_, index) => worker(index + 1));

  if (runSeconds > 0) {
    setTimeout(() => {
      stopping = true;
    }, runSeconds * 1000);
  }

  await Promise.all(workers);
  clearInterval(interval);
  printStats();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});