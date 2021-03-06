'use strict';

const authorizeAccess = async function (credentials) {
    try {
        if(credentials === process.env.BLUEBOX_TOKEN) {
            return true
        } else {
            return false
        }
    } catch(e) {
        return e
    }
}

module.exports = {
    authorizeAccess
}