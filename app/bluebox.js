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
                let type = (replacementRules[i].type)? replacementRules[i].type : null;
                responseData = await replaceAndCypher(request, replacementRules[i].attributeName, cypherAction, ttl, type);
            }
            resolve(responseData)
        } catch(e) {
            reject(e)
        }
    });
}

async function replaceAndCypher(request, ruleAttributeName, cypherAction, ttl, type){
    return new Promise(async function(resolve, reject) {
        try {
            for(var property in request){
                if(typeof request[property] == typeof {}){
                  await replaceAndCypher(request[property], ruleAttributeName, cypherAction, ttl, type);
                }
                if(property === ruleAttributeName){ 
                    request[property] = await cypher(cypherAction, request[property], ttl, type);
                }
            }
            resolve(request); 
        } catch (e) {
            reject(e);
        }
    });
}

async function cypher(action, value, ttl, type) {
    try {
        if(action) {
            let alias = value.match(/bx_\w+_bx/g)[0];
            let encodedValue = await getFromDb(alias); //the value is the alias
            let rawData = await decodeSensibleData(encodedValue);
            rawData = (type === 'PAN')? value.replace(alias, rawData) : rawData;
            return rawData
        } else {
            value = (type === 'PAN')? value.replace(/\D/g, '') : value; //remove spaces and - if PAN
            let valueToEncrypt = (type === 'PAN')? await getMiddleDigits(value) : value;
            console.log(valueToEncrypt)
            ttl = (type === 'CVV' && !ttl)? 3600 : ttl; //If the value to encode is a CVV type, but TTL is not defined it will save it with 3h expiration by default.
            let encodedValue = await encodeSensibleData(valueToEncrypt); //value is the raw data
            let alias = await saveInDb(encodedValue, ttl); //return alias
            console.log(alias)
            alias = (type === 'PAN')? value.replace(valueToEncrypt, alias) : alias; //if has a type returns the request as is, replacing the sensitive part.
            console.log('--->'+alias)
            return alias
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

const extractFirstPart = (code) => {
	const chunk = code.match(/\w+bx_/g)[0]
	return chunk.substring(0, chunk.length-3)
}
const extractLastPart = (code) => {
	const chunk = code.match(/\_bx\w+/g)[0]
	return chunk.substr(3)
}

async function getMiddleDigits(cardNumber) {
    //Gets everything but the first 6 and last 4 digits.
    return cardNumber.substring(6, cardNumber.length-4);
}