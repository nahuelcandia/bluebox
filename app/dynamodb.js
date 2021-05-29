const dynamoose = require("dynamoose");
const { v4: uuidv4 } = require('uuid');

try {
  const ddb = new dynamoose.aws.sdk.DynamoDB({
    // Lambda executes within roles, so it does not require keys.
    //"accessKeyId": process.env.DB_ACCESSKEYID,
    //"secretAccessKey": process.env.DB_SECRETACCESSKEY,
    "region": process.env.AWSREGION
  });
  
  if(process.env.NODE_ENV === 'dev') {
    dynamoose.aws.ddb.local();
  } else {
    dynamoose.aws.ddb.set(ddb);
  }
} catch(error) {
  console.log(error)
  throw error
}

const blueboxData = dynamoose.model('bluebox_'+process.env.NODE_ENV, new dynamoose.Schema({
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
  "create": false,
  "serverSideEncryption": true
});  

const saveInDb = async function(encryptedData, ttl) {
  return new Promise(async function(resolve, reject) {
    try {
      let inputData = {
        "alias": 'bx_'+uuidv4().toString().replace(/-/g, '')+'_bx',
        "value": encryptedData,
        "updatedAt": Date.now(), 
        "createdAt": Date.now()
      }
      //convert ttl from seconds to ms and add to current time, then convert in epoch time format as required by DynamoDB
      if(ttl) inputData.ttl = Math.floor(new Date().getTime() + (ttl*1000));
      const document = new blueboxData(inputData);
      await document.save().catch(error => { console.log(error); reject(error); });
      resolve(inputData.alias);
    } catch(e) {
      console.log(e);
      reject(e);
    }
  });
}

const getFromDb = async function(alias) {
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

module.exports = {
  saveInDb,
  getFromDb
}