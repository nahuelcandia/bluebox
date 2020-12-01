const dynamoose = require("dynamoose");
const { v4: uuidv4 } = require('uuid');

const ddb = new dynamoose.aws.sdk.DynamoDB({
  "accessKeyId": process.env.DB_ACCESSKEYID,
  "secretAccessKey": process.env.DB_SECRETACCESSKEY,
  "region": process.env.DB_REGION
});

if(process.env.NODE_ENV === 'dev') {
  dynamoose.aws.ddb.local();
} else {
  dynamoose.aws.ddb.set(ddb);
}

const blueboxData = dynamoose.model("bluebox", new dynamoose.Schema({
    "alias": {
      "type": String,
      "hashKey": true
    }, 
    "value": String, 
    "ttl": Date,
    "updatedAt": Date, 
    "createdAt": Date
  }), { 
    "saveUnknown": false,
    "timestamps": true,
    "create": true
});


module.exports.saveInDb = async function(encryptedData, ttl) {
  return new Promise(async function(resolve, reject) {
    try {
      let inputData = {
        "alias": 'bluebox_'+uuidv4().toString().replace(/-/g, ''),
        "value": encryptedData,
        "updatedAt": Date.now(), 
        "createdAt": Date.now()
      }
      if(ttl) inputData.ttl = Math.floor(new Date().addHours(ttl) / 1000);

      const document = new blueboxData(inputData);
      document.save().catch(error => { console.log(error); reject(error); });
      resolve(inputData.alias);
    } catch(e) {
      console.log(e);
      reject(e);
    }
  });
}

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

module.exports.getFromDb = async function(alias) {
  return new Promise(async function(resolve, reject) {
    try {
      let response = await blueboxData.query("alias").eq(alias).attributes(["value"]).limit(1).exec();
      resolve(response[0].value)
    } catch(e) {
      console.log(e);
      reject(e);
    }
  });
}