const Joi = require("joi");

// 📌 Register Validation
const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages({
      "string.empty": "Name is required",
      "string.min": "Name should be at least 3 characters",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password should be at least 6 characters",
      "any.required": "Password is required",
    }),
    role: Joi.string().valid("customer", "owner", "admin").default("customer"),
  });

  return schema.validate(data);
};

// 📌 Login Validation
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
