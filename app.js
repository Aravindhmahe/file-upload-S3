const express = require(`express`);
const bodyParser = require(`body-parser`);
const fileRoutes = require("./routes/uploadFile-routes");

const app = express();
app.use(bodyParser.json());

app.use(fileRoutes);

module.exports = app;
