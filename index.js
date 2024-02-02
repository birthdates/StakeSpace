const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev: dev });
const handle = app.getRequestHandler();
const httpsOptions = {
  key: fs.readFileSync("./cert/key.pem"),
  cert: fs.readFileSync("./cert/cert.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(dev ? 3000 : 443, (err) => {
    if (err) throw err;
    console.log("> Server started on https://localhost:" + dev ? 3000 : "");
  });
});
