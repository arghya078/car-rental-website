const jwt = require("jsonwebtoken");

// Generate JWT 
const generateJWT = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};



module.exports = {
  generateJWT
};
