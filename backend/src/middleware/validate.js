'use strict';
const { ValidationError } = require('../utils/errors');

// Joi schema validation middleware factory
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join('; ');
    return next(new ValidationError(message));
  }
  req[source] = value;
  next();
};

module.exports = { validate };
