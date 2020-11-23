const rp = require('request-promise');
const bluebox = require('./bluebox');
const authorizer = require('./authorizer');

exports.redirectRequest = async function (req, res) {
  try {
    // When access is granted to the Bluebox, it automatically acts as a Decoder of the sensible data.
    // The request will be forwarded to the url defined in the header X-Bluebox-Forward-To
    // Otherwise, it will act as an encoder; the sensible data will be catched and replaced by aliases, and then
    // forwarded to the URL defined in the process.env.PROXY_TARGET adding the same path.
    // On both cases the method used is the same of the original request.

    let proxyTarget = process.env.PROXY_TARGET;
    proxyTarget += (req.path)? req.path.substring(1) : null;
    
    //Detect if should act as reverse proxy, and decrypt data and forward to a 3rd party.
    if(typeof req['headers']['x-bluebox-authorization'] !== 'undefined' && req['headers']['x-bluebox-authorization'] != null) {
      let isDecodeMode = await authorizer.authorizeAccess(req['headers']['x-bluebox-authorization']);
      if(isDecodeMode) {
        await getHeaderProxyTarget(req.headers, req.path).then(response => {
          proxyTarget = response;
        }).catch(error => {
          res.send(error);
        });
        await forwardRequest(req, proxyTarget, isDecodeMode).then(response => {
          res.send(response);
        }).catch(error => {
          res.send(error);
        });
      } else {
        res.status(401).send({"message": "Bluebox access denied."})
      }
    } else {
      await forwardRequest(req, proxyTarget, false).then(response => {
        res.send(response);
      }).catch(error => {
        res.send(error);
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({'error': err});
  }
}


function isEmpty(obj) {
  if(!Object.keys(obj).length > 0) {
    return true;
  } else {
    return false;
  }
}

async function urlParamsFiller(string, params)  {
  for (const param of Object.keys(params)) {
    string = string.replace(`:${param}`, params[param]);
  }
  return string;
}

async function getHeaderProxyTarget(headers, path) {
  return new Promise(function(resolve, reject) {
    if(typeof headers['x-bluebox-forward-to'] !== 'undefined' && headers['x-bluebox-forward-to'] != null) {
      resolve(headers['x-bluebox-forward-to'] + path.substring(1));
    } else {
      reject({"message": "Invalid x-bluebox-forward-to header. Please set a proxy target."});
    }
  });
}

async function forwardRequest(req, proxyTarget, isDecodeMode) {
  return new Promise(async function(resolve, reject) {
    let options = {
      url: proxyTarget,
      method: req.method,
      json: true,
      headers: {},
      followAllRedirects: true
    }
  
    //Intercept and forward the querystrings
    if(typeof req.query !== 'undefined' && req.query != null && isEmpty(req.query) == false){
      options['qs'] = req.query;
    }
  
    //Intercept and forward the path parameters
    if(typeof req.params !== 'undefined' && req.params != null && isEmpty(req.params) == false){
      options['url'] = await urlParamsFiller(options['url'], req.params);
    }
  
    //Intercept and forward the request body
    if(typeof req.body !== 'undefined' && req.body != null && isEmpty(req.body) == false) {
      options['body'] = req.body;
    }
  
    if(isDecodeMode) {
      options = await bluebox.decodeSensibleData(options);
    } else {
      options = await bluebox.encodeSensibleData(options);
    }
    console.log(options)
    rp(options)
    .then(response => {
      resolve(response);
    }).catch(err => {
      if(typeof err.response !== 'undefined') {
        reject(err.response);
      } else {
        reject(err);
      }
    });
  });
}