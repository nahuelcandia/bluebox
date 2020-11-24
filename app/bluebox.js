'use strict';

exports.blueboxReplacer = async function (cypherAction, data) {
    // Searches for parameters to replace in the data
    // based on the config/replacementRules.json
    // for each item found it will encrypt or decrypt the data.
    // if cypherAction is true it will encrypt, otherwise it will decrypt the data.

    let replacedData = {}
    
    if(cypherAction) {
        replacedData = await encodeSensibleData (data);
    } else {
        replacedData = await decodeSensibleData (data);
    }

    return replacedData
}

async function  encodeSensibleData (data) {
    return new Promise(function(resolve, reject) {
        console.log('Encode sensible data');
        resolve(data)
    });
}

async function decodeSensibleData (data) {
    return new Promise(function(resolve, reject) {
        console.log('Decode sensible data');
        resolve(data)
    });
}