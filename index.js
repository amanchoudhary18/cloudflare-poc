const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");

app.use(bodyParser.json());

// Cloudflare account details
const email = "aman.choudhary9785@gmail.com";
const apiKey = "5d3b864a6054d58d495ed17360c06a9d2b338";

// Cloudflare API endpoint URLs
const baseURL = "https://api.cloudflare.com/client/v4";
const zonesURL = "https://api.cloudflare.com/client/v4/zones";

// List all zones
app.get("/list-zones", async (req, res) => {
  try {
    const response = await axios.get(zonesURL, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    res.json({
      success: true,
      count: response.data.result.length,
      zones: response.data.result,
    });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Zone
app.post("/add-zone", async (req, res) => {
  const { domain } = req.body;

  const data = {
    name: domain,
    jump_start: true,
  };

  try {
    const response = await axios.post(zonesURL, data, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    const recordsResponse = await axios.get(
      `${zonesURL}/${response.data.result.id}/dns_records`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const zoneId = response.data.result.id;
    const domainRecords = recordsResponse.data.result;

    res.json({ success: true, zone: response.data.result });
  } catch (error) {
    if (error.response.data && error.response.data.errors[0].code === 1061) {
      console.log(error.response.data);
      res.status(500).json({ success: false, error: "Domain already exists" });
    } else res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Zone
app.delete("/delete-zone/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.delete(`${zonesURL}/${zoneId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    res.json({ success: true, message: "Zone deleted successfully" });
  } catch (error) {
    if (error.response) console.log(error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List DNS Records
app.get("/list-records/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const recordsResponse = await axios.get(
      `${zonesURL}/${zoneId}/dns_records`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, records: recordsResponse.data.result });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check Zone Status (Pending or Active)
app.get("/check-zone-status/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    const zoneStatus = response.data.result.status;

    res.json({ success: true, zoneId, status: zoneStatus });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all DNS Records for a Zone
app.get("/list-dns-records/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/dns_records`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    res.json({ success: true, zoneId, dnsRecords: response.data.result });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add DNS Record for a Zone
app.post("/add-dns-record/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { type, name, content, priority } = req.body;

  let data = {
    type,
    name,
    content,
  };

  if (type === "MX") {
    if (!priority) {
      return res
        .status(400)
        .json({ success: false, error: "Priority is required for MX record." });
    }
    data = {
      ...data,
      priority,
    };
  }

  try {
    const response = await axios.post(
      `${zonesURL}/${zoneId}/dns_records`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, record: response.data.result });
  } catch (error) {
    if (error.response.data && error.response.data.errors[0].code === 81057) {
      console.log(error.response.data);
      res.status(500).json({ success: false, error: "Record already exists" });
    } else res.status(500).json({ success: false, error: error.message });
  }
});

// Delete DNS Record for a Zone
app.delete("/delete-dns-record/:zoneId/:recordId", async (req, res) => {
  const { zoneId, recordId } = req.params;

  try {
    const response = await axios.delete(
      `${zonesURL}/${zoneId}/dns_records/${recordId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    if (error.response.data && error.response.data.errors[0].code === 81044) {
      console.log(error.response.data);
      res.status(500).json({ success: false, error: "Record does not exist" });
    } else res.status(500).json({ success: false, error: error.message });
  }
});

// Edit DNS Record for a Zone (Filter by Type)
app.put("/edit-dns-record/:zoneId/:recordId", async (req, res) => {
  const { zoneId, recordId } = req.params;
  const { type, name, content, priority } = req.body;

  let data = {
    type,
    name,
    content,
  };

  if (type === "MX") {
    if (!priority) {
      return res
        .status(400)
        .json({ success: false, error: "Priority is required for MX record." });
    }
    data = {
      ...data,
      priority,
    };
  }

  try {
    const response = await axios.put(
      `${zonesURL}/${zoneId}/dns_records/${recordId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, record: response.data.result });
  } catch (error) {
    if (error.response.data && error.response.data.errors[0].code === 81044) {
      console.log(error.response.data);
      res.status(500).json({ success: false, error: "Record does not exist" });
    } else res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
