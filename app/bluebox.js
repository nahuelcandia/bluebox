'use strict';
const replacementRules = require("../config/replacementRules.json");

exports.blueboxReplacer = async function (cypherAction, data) {
    // Searches for parameters to replace in the data
    // based on the config/replacementRules.json
    // for each item found it will encrypt or decrypt the data.
    // if cypherAction is true it will decrypt, otherwise it will encrypt the data.
    let responseData = {}
    for(var i= 0; i < replacementRules.length; i++) {
        responseData = await replaceAndCypher(data, replacementRules[i].attributeName, cypherAction);
    }
    return responseData
}

async function  encodeSensibleData (data) {
    return new Promise(async function(resolve, reject) {
        console.log('Encode sensible data');
        console.log(data);
        data = 'Bananas';
        resolve(data)
    });
}

async function decodeSensibleData (data) {
    return new Promise(async function(resolve, reject) {
        console.log('Decode sensible data');
        console.log(data);
        data = 'Petete';
        resolve(data)
    });
}

async function replaceAndCypher(object, indexName, cypherAction){
    return new Promise(async function(resolve, reject) {
        for(var x in object){
            if(typeof object[x] == typeof {}){
              await replaceAndCypher(object[x], indexName, cypherAction);
            }
            if(x === indexName){ 
              object[indexName] = await cypher(cypherAction, object[indexName]);
            }
        }
        resolve(object); 
    });
}

async function cypher(action, value) {
    if(action) {
        return await decodeSensibleData(value);
    } else {
        return await encodeSensibleData(value);
    }
}