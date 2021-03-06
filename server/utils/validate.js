const tv4 = require('tv4');
const { isEmail, isUUID, isISO8601 } = require('validator');
const schemaPasswordless = require('../schema/passwordless.json');
const schemaExchange = require('../schema/exchange.json');
const schemaDelay = require('../schema/delay.json');

exports.initialize = () => {
  tv4.addFormat({
    email: (value) => {
      if (isEmail(value)) {
        return null;
      }
      return 'invalid email address';
    },
    uuid: (value) => {
      if (value === null || value === '') {
        return null;
      }
      if (isUUID(value, 4)) {
        return null;
      }
      return 'invalid UUID';
    },
    iso8601: (value) => {
      if (isISO8601(value)) {
        return null;
      }
      return 'invalid date format';
    },
  });
};

function validate(schema, payload) {
  return new Promise((resolve, reject) => {
    const result = tv4.validateMultiple(payload, schema);
    if (result.valid) {
      resolve(true);
      return;
    }
    let errorMessage = 'Invalid payload';
    if (result.errors.length === 1) {
      errorMessage = result.errors[0].message;
    }
    const err = new Error(errorMessage);
    err.httpCode = 422;
    err.validationErrors = result.errors;
    reject(err);
  });
}

exports.validatePasswordless = payload => validate(schemaPasswordless, payload);
exports.validateExchange = payload => validate(schemaExchange, payload);
exports.validateDelay = payload => validate(schemaDelay, payload);
