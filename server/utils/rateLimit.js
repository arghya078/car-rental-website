const rateLimit = require("express-rate-limit");

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 6,                   
  message: { message: "Too many requests, try again later." } 
});

module.exports = forgotLimiter;