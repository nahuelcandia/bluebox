'use strict';
const replacementRules = require("../config/replacementRules.json");
const { encodeSensibleData, decodeSensibleData } = require("./cypher");
const { saveInDb, getFromDb } = require("./dynamodb");

exports.blueboxReplacer = async function (cypherAction, data) {
    // Searches for parameters to replace in the data
    // based on the config/replacementRules.json
    // for each item found it will encrypt or decrypt the data.
    // if cypherAction is true it will decrypt, otherwise it will encrypt the data.
    return new Promise(async function(resolve, reject) {
        try {
            let responseData = {}
            for(var i= 0; i < replacementRules.length; i++) {
                responseData = await replaceAndCypher(data, replacementRules[i].attributeName, cypherAction);
            }
            resolve(responseData)
        } catch(e) {
            reject(e)
        }
    });
}

async function replaceAndCypher(object, indexName, cypherAction){
    return new Promise(async function(resolve, reject) {
        try {
            for(var x in object){
                if(typeof object[x] == typeof {}){
                  await replaceAndCypher(object[x], indexName, cypherAction);
                }
                if(x === indexName){ 
                  object[indexName] = await cypher(cypherAction, object[indexName]);
                }
            }
            resolve(object); 
        } catch (e) {
            reject(e);
        }
    });
}

async function cypher(action, value) {
    if(action) {
        let encodedValue = await getFromDb(value); //the value is the alias
        return await decodeSensibleData(encodedValue); //return raw data
    } else {
        let encodedValue = await encodeSensibleData(value); //value is the raw data
        return await saveInDb(encodedValue) //return alias
    }
}