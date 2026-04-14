const { error } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const { error: validationError, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (validationError) {
      const errors = validationError.details.map((d) => d.message);
      return error(res, 'Validation failed', 422, errors);
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
