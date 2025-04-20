const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Load config with proper error handling
function loadConfig() {
  try {
    const rawData = fs.readFileSync(
      path.join(__dirname, "../config/config.json")
    );
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
}

// Helper function to save config
function saveConfig(newConfig) {
  try {
    fs.writeFileSync(
      path.join(__dirname, "../config/config.json"),
      JSON.stringify(newConfig, null, 2)
    );
    console.log("Config updated successfully");
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
}

// Get bKash token
exports.getToken = async (req, res) => {
  try {
    const config = loadConfig();
    console.log("Current config before token grant:", config);

    const token = await grantToken();
    console.log("New token received:", token);

    res.send({ id_token: token });
  } catch (error) {
    console.error("Error getting token:", error);
    res.status(500).send({ error: "Failed to get token" });
  }
};

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const config = loadConfig(); // Load fresh config each time
    console.log("Current config in createPayment:", config);

    if (!config.token) {
      throw new Error("No token available in config");
    }

    const { amount } = req.query;
    const invoice = "46f647h7"; // must be unique
    const intent = "sale";

    const paymentData = {
      amount: amount,
      currency: "BDT",
      merchantInvoiceNumber: invoice,
      intent: intent,
    };

    console.log("Making request with token:", config.token);
    console.log("Request headers:", {
      "Content-Type": "application/json",
      authorization: config.token,
      "x-app-key": config.app_key,
    });

    const response = await axios.post(config.createURL, paymentData, {
      headers: {
        "Content-Type": "application/json",
        authorization: config.token,
        "x-app-key": config.app_key,
      },
    });

    res.send(response.data);
  } catch (error) {
    console.error(
      "Error creating payment:",
      error.response?.data || error.message,
      error.stack
    );
    res.status(500).send({
      error: "Failed to create payment",
      details: error.response?.data || error.message,
    });
  }
};

// Execute payment
exports.executePayment = async (req, res) => {
  try {
    const config = loadConfig(); // Load fresh config each time
    const { paymentID } = req.query;

    if (!config.token) {
      throw new Error("No token available in config");
    }

    const response = await axios.post(
      config.executeURL + paymentID,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          authorization: config.token,
          "x-app-key": config.app_key,
        },
      }
    );
    console.log("execute api response-----", response);
    res.send(response.data);
  } catch (error) {
    console.error(
      "Error executing payment:",
      error.response?.data || error.message,
      error.stack
    );
    res.status(500).send({
      error: "Failed to execute payment",
      details: error.response?.data || error.message,
    });
  }
};

// Helper function to get token
async function grantToken() {
  const config = loadConfig();

  const postData = {
    app_key: config.app_key,
    app_secret: config.app_secret,
  };

  console.log("Requesting token with:", postData);
  console.log("Using auth headers:", {
    password: config.password,
    username: config.username,
  });

  const response = await axios.post(config.tokenURL, postData, {
    headers: {
      "Content-Type": "application/json",
      password: config.password,
      username: config.username,
    },
  });

  if (!response.data.id_token) {
    throw new Error("No id_token received in response");
  }

  // Update config with new token
  const newConfig = { ...config, token: response.data.id_token };
  saveConfig(newConfig);

  return response.data.id_token;
}
