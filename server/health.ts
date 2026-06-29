import { createServer } from "node:http";

const port = Number.parseInt(process.env.PORT || "3001", 10);

const server = createServer((request, response) => {
  if (request.url === "/health" || request.url === "/") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      status: "ok",
      service: "sakae-agent",
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ status: "not_found" }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[HEALTH] Listening on port ${port}`);
});
