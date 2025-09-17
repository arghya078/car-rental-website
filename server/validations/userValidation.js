const Joi = require("joi");

// 📌 Profile update validation
const updateProfileValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    address: Joi.string().min(5).max(200).optional(),
    phone: Joi.string()
      .pattern(/^[0-9]{10,15}$/) // allow 10-15 digit phone numbers
      .optional(),
  });
  return schema.validate(data);
};

module.exports = { updateProfileValidation };
