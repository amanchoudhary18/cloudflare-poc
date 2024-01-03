const express = require("express");
const router = express.Router();

const {
  LightsailClient,
  GetInstancesCommand,
  CreateInstancesCommand,
  GetInstanceStateCommand,
} = require("@aws-sdk/client-lightsail");

const lightsail = new LightsailClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/launchInstance", async (req, res) => {
  const { instanceName } = req.body;

  if (!instanceName) {
    return res.status(400).json({ error: "Instance name is required." });
  }

  const params = {
    instanceNames: [instanceName],
    availabilityZone: "ap-south-1a",
    blueprintId: "amazon_linux_2023",
    bundleId: "nano_2_1",
    tags: [{ key: "Name", value: instanceName }],
  };

  try {
    const command = new CreateInstancesCommand(params);

    lightsail
      .send(command)
      .then((response) => {
        console.log("Instance created successfully:");
        const instanceId = response.operations[0].resourceId;
        return res
          .status(200)
          .json({ message: "Instance created successfully", response });
      })
      .catch((err) => {
        console.error("Error creating instance:", err);
        return res
          .status(500)
          .json({ error: "Failed to create instance", details: err });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/getAllInstances", async (req, res) => {
  try {
    const command = new GetInstancesCommand({});
    const instances = await lightsail.send(command);
    console.log("All instances:", instances);
    return res.status(200).json({ instances });
  } catch (error) {
    console.error("Error getting instances:", error);
    return res
      .status(500)
      .json({ error: "Failed to get instances", details: error });
  }
});

router.get("/getInstance/:instanceId", async (req, res) => {
  const { instanceId } = req.params;

  try {
    const command = new GetInstanceStateCommand({ instanceName: instanceId });
    const instanceDetails = await lightsail.send(command);
    console.log("Instance details:", instanceDetails);
    return res.status(200).json({ instanceDetails });
  } catch (error) {
    console.error("Error getting instance details:", error);
    return res
      .status(500)
      .json({ error: "Failed to get instance details", details: error });
  }
});

module.exports = router;
