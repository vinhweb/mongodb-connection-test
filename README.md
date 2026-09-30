# MongoDB connection test

Tiny Node.js service that connects to MongoDB and runs a read-only `ping`.

## Local run

Requires Node.js 22.9+.

1. Run `npm ci` in this folder.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`.
3. Run `npm start`.
4. Open http://localhost:3000/test-db.

`GET /health` returns 200 when the app is running. `GET /test-db` returns 200 on a successful MongoDB ping or 503 on failure, including elapsed milliseconds. A ping checks connectivity and authentication, not collection read/write permissions. No documents are created or changed.

## Deploy on Dokploy (VPS)

1. Put this project in a Git repository and create an Application in Dokploy connected to that repository.
2. Choose the **Dockerfile** build type. If the repository contains this subfolder, set Dockerfile Path to `mongodb-connection-test/Dockerfile` and Docker Context Path to `mongodb-connection-test`. If this folder is the repository root, use `Dockerfile` and `.` respectively.
3. In the MongoDB service, copy its **Internal Connection URL**. Set it as the application's runtime environment variable `MONGODB_URI`. Set `PORT=3000`. Do not put the connection string in Docker build arguments.
4. Ensure the application and MongoDB service share a Docker network on the VPS. Merely running on the same VPS is not enough; the app must resolve and reach the database's internal hostname.
5. Add a domain to the application with container port **3000**, then deploy.
6. Visit `/health` and then `/test-db` on that domain. MongoDB does not need a public port for this test.

References: [Dokploy Dockerfile settings](https://docs.dokploy.com/docs/core/applications/build-type), [internal database connections](https://docs.dokploy.com/docs/core/databases/connection).

## Other deployments

Set the deployment root to `mongodb-connection-test`. Use build command `npm ci --omit=dev`, start command `npm start`, and health check path `/health`. Alternatively, build the included Dockerfile. The server binds to `0.0.0.0` and uses the platform's `PORT` (default 3000).

Set `MONGODB_URI` as a deployment secret to the database's **internal** connection string. Deploy this app on a network that can reach that MongoDB host (for example, the same private network/project). Internal hostnames usually cannot be reached from your laptop or an unrelated hosting provider. `localhost` inside the app container refers to that container itself.

Open `https://YOUR-APP/test-db` after deployment. A successful response looks like:

```json
{ "ok": true, "message": "MongoDB connection successful", "durationMs": 12 }
```

For a failure, check private DNS, port/firewall access, credentials, `authSource`, and any required TLS options. Use the provider's connection string, including replica set options where required. URI-encode special characters in credentials. Credentials and raw driver errors are never returned by the app.

Driver reference: https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/
