
const https = require("https");
const { URL } = require("url");

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const MODE = (process.env.PAYPAL_MODE || "sandbox").toLowerCase(); 

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing PayPal credentials. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in environment."
  );
}

if (!MODE) {
  console.error("Missing PayPal mode. Please set PAYPAL_MODE in environment.");
}

// Base host selection
const BASE = MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

// Simple token cache
let _cachedToken = null; // { token, expiresAt (ms since epoch) }

// convert
function majorToMinor(amountMajor) {
  const n = Number(amountMajor);
  if (!Number.isFinite(n)) throw new Error("Invalid amountMajor");
  // Multiply by 100 and round to avoid float issues, return integer cents
  return Math.round(n * 100);
}

// convert
function majorToDecimal(amountMajor) {
  const n = Number(amountMajor);
  if (!Number.isFinite(n)) throw new Error("Invalid amountMajor");
  return n.toFixed(2);
}

const rupeesToPaise = majorToMinor;
const rupeesToDecimal = majorToDecimal;

//make api request
async function _apiRequest(path, method = "GET", body = null, useRawBody = false) {
  const token = await _getAccessToken();

  const url = new URL(BASE + path);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (body !== null && !useRawBody) headers["Content-Type"] = "application/json";
  if (useRawBody && body !== null && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const payload = body && !useRawBody ? JSON.stringify(body) : body;

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const status = res.statusCode || 0;
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch (err) {
            // non JSON response
          }
          if (status >= 200 && status < 300) {
            resolve({ status, data: json });
          } else {
            const errPayload = json || { message: data || `HTTP ${status}` };
            const err = new Error(`PayPal API error ${status}: ${JSON.stringify(errPayload)}`);
            err.status = status;
            err.payload = errPayload;
            reject(err);
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

// get access token
async function _getAccessToken() {
  if (_cachedToken && _cachedToken.expiresAt && Date.now() < _cachedToken.expiresAt - 15 * 1000) {
    return _cachedToken.token;
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const url = new URL(
    (MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com") + "/v1/oauth2/token"
  );

  const body = "grant_type=client_credentials";
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.access_token) {
              const expiresIn = Number(json.expires_in || 3200);
              _cachedToken = {
                token: json.access_token,
                expiresAt: Date.now() + expiresIn * 1000,
              };
              resolve(json.access_token);
            } else {
              reject(new Error("Could not obtain PayPal access token: " + JSON.stringify(json)));
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.write(body);
    req.end();
  });
}

// create order
async function createOrder(input) {
  let amountDecimal;
  let currency = "USD";
  let bookingId;
  let description;
  let application_context;

  if (input === undefined || input === null) {
    throw new Error("createOrder requires an amount (or options object)");
  }

  if (typeof input === "object" && !Array.isArray(input)) {
    const opts = input;
    if (opts.amountInPaise !== undefined && opts.amountInPaise !== null) {
      amountDecimal = (Number(opts.amountInPaise) / 100).toFixed(2);
    } else if (opts.amountInCents !== undefined && opts.amountInCents !== null) {
      amountDecimal = (Number(opts.amountInCents) / 100).toFixed(2);
    } else {
      const amountMajor = opts.amountMajor ?? opts.amount ?? opts.amount_in_rupees ?? opts.amountRupees;
      if (amountMajor === undefined || amountMajor === null) {
        throw new Error("amount required in createOrder options");
      }
      amountDecimal = majorToDecimal(amountMajor);
    }
    currency = opts.currency ?? currency;
    bookingId = opts.bookingId ?? opts.referenceId ?? opts.reference_id;
    description = opts.description;
    application_context = opts.application_context;
  } else {
    amountDecimal = majorToDecimal(input);
  }

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: bookingId ? String(bookingId) : undefined,
        description: description || undefined,
        amount: {
          currency_code: String(currency || "USD").toUpperCase(),
          value: String(amountDecimal),
        },
      },
    ],
  };

  if (application_context && typeof application_context === "object") {
    body.application_context = application_context;
  }

  const res = await _apiRequest("/v2/checkout/orders", "POST", body);
  return res.data;
}

// capture order
async function captureOrder(orderId) {
  if (!orderId) throw new Error("orderId is required to capture order");

  const res = await _apiRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, "POST", {});
  return res.data;
}

// get order
async function getOrder(orderId) {
  if (!orderId) throw new Error("orderId required");
  const res = await _apiRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, "GET");
  return res.data;
}

// get capture
async function getCapture(captureId) {
  if (!captureId) throw new Error("captureId required");
  const res = await _apiRequest(`/v2/payments/captures/${encodeURIComponent(captureId)}`, "GET");
  return res.data;
}

// refund capture
async function refundCapture(captureId, opts = {}) {
  if (!captureId) throw new Error("captureId required for refund");

  let body = null;
  if (opts) {
    let amountDecimal = null;
    if (opts.amountInPaise !== undefined && opts.amountInPaise !== null) {
      amountDecimal = (Number(opts.amountInPaise) / 100).toFixed(2);
    } else if (opts.amountInCents !== undefined && opts.amountInCents !== null) {
      amountDecimal = (Number(opts.amountInCents) / 100).toFixed(2);
    } else if (opts.amountMajor !== undefined && opts.amountMajor !== null) {
      amountDecimal = majorToDecimal(opts.amountMajor);
    } else if (typeof opts === "number") {
      amountDecimal = majorToDecimal(opts);
    }

    if (amountDecimal !== null) {
      const currency = (opts.currency || "USD").toUpperCase();
      body = {
        amount: {
          value: String(amountDecimal),
          currency_code: currency,
        },
      };
    }
  }

  const res = await _apiRequest(
    `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
    "POST",
    body ?? {}
  );
  return res.data;
}

module.exports = {
  createOrder,
  captureOrder,
  getOrder,
  getCapture,
  refundCapture,

  // helpers 
  majorToMinor,
  majorToDecimal,

  rupeesToPaise,
  rupeesToDecimal,

  _getAccessToken,
  
  BASE,
};
