import http from 'node:http';
import { MongoClient } from 'mongodb';

const port = Number(process.env.PORT || 3000);
let client;

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  if (req.method !== 'GET') return json(res, 405, { error: 'Use GET' });
  if (path === '/') {
    return json(res, 200, {
      app: 'MongoDB connection test',
      endpoints: { '/health': 'App health', '/test-db': 'Connect and ping MongoDB' },
    });
  }
  if (path === '/health') return json(res, 200, { ok: true });
  if (path !== '/test-db') return json(res, 404, { error: 'Not found' });
  if (!process.env.MONGODB_URI) {
    return json(res, 503, { ok: false, error: 'Set MONGODB_URI in the deployment environment or .env file.' });
  }

  const start = performance.now();
  try {
    client ??= new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      timeoutMS: 5000,
      maxPoolSize: 5,
    });
    await client.connect();
    await client.db().command({ ping: 1 });
    json(res, 200, { ok: true, message: 'MongoDB connection successful', durationMs: Math.round(performance.now() - start) });
  } catch (error) {
    // Avoid exposing connection strings, credentials, or raw driver errors.
    const authenticationFailed = error.code === 18 || error.cause?.code === 18;
    json(res, 503, {
      ok: false,
      error: authenticationFailed ? 'Authentication failed. Check credentials and authSource.' : 'Connection failed. Check the URI, internal DNS, network access, and TLS configuration.',
      durationMs: Math.round(performance.now() - start),
    });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`MongoDB connection tester listening on port ${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => {
      await client?.close();
      clearTimeout(deadline);
    });
  });
}
