const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config({ path: ".env" });

app.use(bodyParser.json());

// Cloudflare account details
const email = process.env.EMAIL;
const apiKey = process.env.APIKEY;
console.log(email, apiKey);
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
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
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get SSL settings
app.get("/get-ssl-settings/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/settings/ssl`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    res.json({ success: true, zoneId, sslSettings: response.data.result });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Update SSL Settings
app.patch("/set-ssl-settings/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values : off, flexible, full or strict

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/ssl`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, message: "SSL settings updated successfully" });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Verify SSL Status
app.get("/verify-ssl-status/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/ssl/verification`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    res.json({ success: true, zoneId, sslVerification: response.data.result });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// list edge certificates
app.get("/list-edge-certificates/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    // Use below format for all certificates

    // const response = await axios.get(
    //   `${zonesURL}/${zoneId}/ssl/certificate_packs?status=all`,
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "X-Auth-Email": email,
    //       "X-Auth-Key": apiKey,
    //     },
    //   }
    // );

    // Use below format for only active certificates

    const response = await axios.get(
      `${zonesURL}/${zoneId}/ssl/certificate_packs`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const edgeCertificates = response.data;

    res.json({ success: true, zoneId, edgeCertificates });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Opportunistic Encryption
app.get("/get-opportunistic-encryption/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `${zonesURL}/${zoneId}/settings/opportunistic_encryption`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const opportunisticEncryption = response.data.result.value;

    res.json({ success: true, zoneId, opportunisticEncryption });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change Opportunistic Encryption
app.patch("/change-opportunistic-encryption/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body;

  const data = {
    value, // Accepted values: "on" or "off"
  };

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/opportunistic_encryption`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Opportunistic Encryption setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get TLS 1.3 setting
app.get("/get-tls-1-3/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/settings/tls_1_3`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    const tls13Setting = response.data.result.value;

    res.json({ success: true, zoneId, tls13Setting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change TLS 1.3 setting
app.patch("/change-tls-1-3/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body;

  const data = {
    value, // Accepted values: "on" or "off"
  };

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/tls_1_3`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "TLS 1.3 setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Brotli
app.get("/get-brotli-compression/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/settings/brotli`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    const brotliCompression = response.data.result.value;

    res.json({ success: true, zoneId, brotliCompression });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

app.get("/get-brotli-compression/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/settings/brotli`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    const brotliCompression = response.data.result.value;

    res.json({ success: true, zoneId, brotliCompression });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

app.patch("/change-brotli-compression/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/brotli`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Brotli compression setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Early Hints
app.get("/get-early-hints/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `${zonesURL}/${zoneId}/settings/early_hints`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const earlyHintsSetting = response.data.result.value;

    res.json({ success: true, zoneId, earlyHintsSetting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

app.patch("/change-early-hints/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/early_hints`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Early Hints setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Rocket Loader
app.get("/get-rocket-loader/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `${zonesURL}/${zoneId}/settings/rocket_loader`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const rocketLoaderSetting = response.data.result.value;

    res.json({ success: true, zoneId, rocketLoaderSetting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

app.patch("/change-rocket-loader/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/rocket_loader`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Rocket Loader setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Auto Minify
app.get("/get-auto-minify/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(`${zonesURL}/${zoneId}/settings/minify`, {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
      },
    });

    const autoMinifySetting = response.data.result;

    res.json({ success: true, zoneId, autoMinifySetting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

app.patch("/change-auto-minify/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { html, css, js } = req.body; // Accepted values: "on" or "off"

  const data = {
    value: {
      html,
      css,
      js,
    },
  };

  //   {
  //      "html": "on",
  //      "css": "off",
  //      "js": "on"
  //    }

  try {
    const response = await axios.patch(
      `${zonesURL}/${zoneId}/settings/minify`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Auto Minify settings changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get 0-RTT Session Resumption Setting
app.get("/get-0rtt/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/0rtt`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const zeroRTTSetting = response.data.result.value;

    res.json({ success: true, zoneId, zeroRTTSetting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change 0-RTT Session Resumption Setting
app.patch("/change-0rtt/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/0rtt`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "0-RTT Session Resumption setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get HTTP/3 (with QUIC) Setting
app.get("/get-http3/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/http3`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const http3Setting = response.data.result.value;

    res.json({ success: true, zoneId, http3Setting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change HTTP/3 (with QUIC) Setting
app.patch("/change-http3/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/http3`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "HTTP/3 (with QUIC) setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get HTTP/2 Setting
app.get("/get-http2/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/http2`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const http2Setting = response.data.result.value;

    res.json({ success: true, zoneId, http2Setting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change HTTP/2 Setting
app.patch("/change-http2/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/http2`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "HTTP/2 setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get HTTP/2 to Origin Setting
app.get("/get-http2-to-origin/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/origin_max_http_version`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const http2ToOriginSetting = response.data.result.value;

    res.json({ success: true, zoneId, http2ToOriginSetting });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change HTTP/2 to Origin Setting
app.patch("/change-http2-to-origin/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: 2 (HTTP/2), 1 (HTTP/1.1)

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/origin_max_http_version`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "HTTP/2 to Origin setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Purge All Cached Content
app.post("/purge-all-cache/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      { purge_everything: true },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "All cached content purged successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Purge Cached Content by URL
app.post("/purge-by-url/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { urls } = req.body; // Array of URLs to purge

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      { files: urls },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Cached content purged by URL successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Cache Level Setting
app.get("/get-cache-level/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/cache_level`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const cacheLevel = response.data.result.value;

    res.json({ success: true, zoneId, cacheLevel });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change Cache Level Setting
app.patch("/change-cache-level/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "aggressive"  (Standard), "basic" (No query string), "simplified" (Ignore query string)

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/cache_level`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Cache level setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Browser Cache TTL Setting
app.get("/get-browser-cache-ttl/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/browser_cache_ttl`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const browserCacheTTL = response.data.result.value;

    res.json({ success: true, zoneId, browserCacheTTL });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change Browser Cache TTL Setting
app.patch("/change-browser-cache-ttl/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Browser Cache TTL value in seconds

  // Allowed values:
  // 0  30  60  120  300  1200  1800  3600  7200  10800  14400  18000  28800  43200  57600  72000  86400  172800
  // 259200  345600  432000  691200  1382400  2073600  2678400  5356800  16070400  31536000

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/browser_cache_ttl`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Browser Cache TTL setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Development Mode Setting
app.get("/get-development-mode/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/development_mode`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const developmentMode = response.data.result.value;

    res.json({ success: true, zoneId, developmentMode });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change Development Mode Setting
app.patch("/change-development-mode/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: 1 (on), 0 (off)

  const data = {
    value: value ? "on" : "off",
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/development_mode`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Development Mode setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Always Online Setting
app.get("/get-always-online/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/always_online`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const alwaysOnline = response.data.result.value;

    res.json({ success: true, zoneId, alwaysOnline });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change Always Online Setting
app.patch("/change-always-online/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: 1 (on), 0 (off)

  const data = {
    value: value ? "on" : "off",
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/always_online`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Always Online setting changed successfully",
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Argo Tiered Caching settings
app.get("/get-argo-tiered-caching/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/argo/tiered_caching`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const argoTieredCachingSettings = response.data.result;

    res.json({ success: true, zoneId, argoTieredCachingSettings });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Update Argo Tiered Caching
app.patch("/update-argo-tiered-caching/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/argo/tiered_caching`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: `Argo Tiered Caching setting updated successfully`,
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// get image resizing setting
app.get("/get-image-resizing-setting/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/image_resizing`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const imageResizingSetting = response.data.result.value;

    res.json({ success: true, zoneId, imageResizingSetting });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// update image resizing
app.patch("/change-image-resizing-setting/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body; // Accepted values: "on" or "off"

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/image_resizing`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      message: "Image Resizing setting changed successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Polish Settings
app.get("/get-polish-setting/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/polish`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const polishSetting = response.data.result.value;

    res.json({ success: true, zoneId, polishSetting });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change Polish settings
app.patch("/change-polish-setting/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body;

  const data = {
    value,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/polish`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, message: "Polish setting changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get webP setting
app.get("/get-webp-setting/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/webp`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const webpSetting = response.data.result.value;

    res.json({ success: true, zoneId, webpSetting });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Change webP setting
app.patch("/change-webp-setting/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { value } = req.body;
  try {
    // Fetch current Polish setting
    const polishResponse = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/polish`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const polishSetting = polishResponse.data.result.value;

    // Allow WebP setting update only if Polish setting is not 'off'
    if (polishSetting !== "off") {
      const data = {
        value: value,
      };

      const response = await axios.patch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/webp`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Email": email,
            "X-Auth-Key": apiKey,
          },
        }
      );

      res.json({ success: true, message: "WebP setting updated successfully" });
    } else {
      res.status(400).json({
        success: false,
        error: "WebP setting cannot be enabled when Polish is set to 'off'",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Page Rules

// List Page Rules
app.get("/list-page-rules/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/pagerules`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const pageRules = response.data.result;

    res.json({ success: true, zoneId, pageRules });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get Page rules details
app.get("/page-rule-details/:zoneId/:identifier", async (req, res) => {
  const { zoneId, identifier } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/pagerules/${identifier}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const pageRuleDetails = response.data.result;

    res.json({ success: true, zoneId, pageRuleDetails });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Create a page rule
app.post("/create-page-rule/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { targets, actions, priority, status } = req.body;

  // Sample Body
  //  {
  //     "status": "active",
  //     "priority": 1,
  //     "actions": [
  //         {
  //             "id": "browser_cache_ttl",
  //             "value": 120
  //         }
  //     ],
  //     "targets": [
  //         {
  //             "target": "url",
  //             "constraint": {
  //                 "operator": "matches",
  //                 "value": "www.aman1.xyz/*"
  //             }
  //         }
  //     ]
  // }

  const pageRuleData = {
    status,
    targets,
    actions,
    priority,
  };

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/pagerules`,
      pageRuleData,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );
    const { id } = response.data.result;
    res.json({
      success: true,
      message: "Page rule created successfully",
      id,
    });
  } catch (error) {
    console.log(error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// edit a page rule
app.patch("/edit-page-rule/:zoneId/:identifier", async (req, res) => {
  const { zoneId, identifier } = req.params;
  const { targets, actions, priority, status } = req.body;

  const updatedPageRuleData = {
    status,
    targets,
    actions,
    priority,
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/pagerules/${identifier}`,
      updatedPageRuleData,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, message: "Page rule edited successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Delete a page rule
app.delete("/delete-page-rule/:zoneId/:identifier", async (req, res) => {
  const { zoneId, identifier } = req.params;

  try {
    const response = await axios.delete(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/pagerules/${identifier}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({ success: true, message: "Page rule deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// Get APO
app.get("/get-apo-settings/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/automatic_platform_optimization`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    const { success } = response.data;
    console.log(response.data.result);
    res.json({
      success,
      result: response.data.result,
    });
  } catch (error) {
    console.error("Error:", error.response.data);
    res
      .status(500)
      .json({ success: false, error: error.response.data.errors[0].message });
  }
});

// change apo setting
app.patch("/change-apo-settings/:zoneId", async (req, res) => {
  const { zoneId } = req.params;
  const { cache_by_device_type, cf, enabled, hostnames, wordpress, wp_plugin } =
    req.body;

  const data = {
    value: {
      cache_by_device_type,
      cf,
      enabled,
      hostnames,
      wordpress,
      wp_plugin,
    },
  };

  try {
    const response = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/automatic_platform_optimization`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
        },
      }
    );

    res.json({
      success: true,
      result: response.data.result,
    });
  } catch (error) {
    console.error("Error:", error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
