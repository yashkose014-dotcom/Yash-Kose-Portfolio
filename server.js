const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = "0.0.0.0";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

const server = http.createServer((req, res) => {
  let reqUrl = decodeURIComponent(req.url.split("?")[0]);
  if (reqUrl === "/") reqUrl = "/index.html";

  const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Portfolio server running!`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- IP:      http://127.0.0.1:${PORT}\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const nextPort = PORT + 1;
    console.log(`Port ${PORT} in use, trying ${nextPort}...`);
    server.listen(nextPort, HOST);
  } else {
    console.error("Server error:", err);
  }
});
