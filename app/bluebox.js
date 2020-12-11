'use strict';
const replacementRules = require("../config/replacementRules.json");
const { encodeSensibleData, decodeSensibleData } = require("./cypher");
const { saveInDb, getFromDb } = require("./dynamodb");

exports.blueboxReplacer = async function (cypherAction, request) {
    // Searches for parameters to replace in the data
    // based on the config/replacementRules.json
    // for each item found it will encrypt or decrypt the data.
    // if cypherAction is true it will decrypt, otherwise it will encrypt the data.
    return new Promise(async function(resolve, reject) {
        try {
            let responseData = {}
            for(var i= 0; i < replacementRules.length; i++) {
                let ttl = (replacementRules[i].ttl)? replacementRules[i].ttl : null;
                let regex = (replacementRules[i].regex)? replacementRules[i].regex : null;
                responseData = await replaceAndCypher(request, replacementRules[i].attributeName, cypherAction, ttl, regex);
            }
            resolve(responseData)
        } catch(e) {
            reject(e)
        }
    });
}

async function replaceAndCypher(request, ruleAttributeName, cypherAction, ttl, regex){
    return new Promise(async function(resolve, reject) {
        try {
            for(var property in request){
                if(typeof request[property] == typeof {}){
                  await replaceAndCypher(request[property], ruleAttributeName, cypherAction, ttl, regex);
                }
                if(property === ruleAttributeName){ 
                    request[property] = await cypher(cypherAction, request[property], ttl, regex);
                }
            }
            resolve(request); 
        } catch (e) {
            reject(e);
        }
    });
}

async function cypher(action, value, ttl, regex) {
    regex = (regex)? new RegExp(regex) : null;
    if(action) {
        let alias = (regex)? value.match(regex) : value;
        let encodedValue = await getFromDb(alias); //the value is the alias
        let rawData = await decodeSensibleData(encodedValue);
        rawData = (regex)? value.replace(regex, rawData) : rawData;
        return rawData
    } else {
        let valueToEncrypt = (regex)? value.match(regex) : value;
        let encodedValue = await encodeSensibleData(valueToEncrypt); //value is the raw data
        let alias = await saveInDb(encodedValue, ttl); //return alias
        alias = (regex)? value.replace(regex, alias) : alias; //if has a regex returns the request as is, replacing the sensitive part.
        return alias
    }
}