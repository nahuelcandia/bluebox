//https://aws.amazon.com/blogs/database/applying-best-practices-for-securing-sensitive-data-in-amazon-dynamodb/

const dynamoose = require("dynamoose");

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

const blueboxData = dynamoose.model("bluebox-"+process.env.NODE_ENV, new dynamoose.Schema({
    "alias": {
      "type": String,
      "hashKey": true
    }, 
    "value": String, 
    "ttl": Number
  }), { 
    "saveUnknown": false,
    "timestamps": true,
    "create": false
});


module.exports.saveInDb = async function(rawData, expiresExpire) {
  let alias = rawData;
  return alias
}

module.exports.getFromDb = async function(alias) {
  return await blueboxData.query("alias").eq(alias).limit(1)
}