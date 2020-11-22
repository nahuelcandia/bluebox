'use strict';

exports.authorizeAccess = async function (credentials) {
    if(credentials === process.env.BLUEBOX_TOKEN) {
        return true
    } else {
        return false
    }
}