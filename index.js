const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config({ path: ".env" });

app.use(bodyParser.json());

const cloudflareRouter = require("./routes/cloudflare-api.route");
app.use("/cloudflare", cloudflareRouter);

const awsLightsailRouter = require("./routes/aws-lightsail.route");
app.use("/lightsail", awsLightsailRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
