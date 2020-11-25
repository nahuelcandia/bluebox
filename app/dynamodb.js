'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

let options = {};

// connect to local DB if running offline
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: 'http://localhost:3000',
  };
}

const client = new AWS.DynamoDB.DocumentClient(options);

module.exports = client;

module.exports.saveInDb = async function(rawData) {
  let alias = rawData;
  return alias
}

module.exports.getFromDb = async function(alias) {
  let encodedValue = alias;
  return encodedValue
}