const sendRequest = require('request-promise');
const bluebox = require('./bluebox');
const authorizer = require('./authorizer');

exports.redirectRequest = async function (req, res) {
  try {
    // When access is granted to the Bluebox, it automatically acts as a Decoder of the sensible data.
    // The request will be forwarded to the url defined in the header X-Bluebox-Forward-To
    // Otherwise, it will act as an encoder; the sensible data will be intercepted by its attribute name at any part of the request
    // (headers, body, params, etc.). Then if a regex is applied, it will only replace the matching expression by an alias, otherwise it will
    // replace all of its value by the alias.
    // An alias is the id as it is saved in the database. It will be used to retrieve the encrypted data, and then decode it.
    // The request will be then forwarded to the URL defined in the process.env.PROXY_TARGET adding the same path(s) and querystring(s).
    // On both cases the method used is the same of the original request.
    // NOTE the proxyTarget should only contain the URL Schema (http:// or https://) and domain (mydomain.com / api.mydomain.com / 127.0.1.1)
    // Ex. https://api.mydomain.com
    
    let proxyTarget = process.env.PROXY_TARGET;
    proxyTarget += (req.path)? req.path.substring(1) : null;
    
    //Detect if should act as reverse proxy, and decrypt data and forward to a 3rd party.
    if(typeof req['headers']['x-bluebox-authorization'] !== 'undefined' && req['headers']['x-bluebox-authorization'] != null) {
      let isDecodeMode = await authorizer.authorizeAccess(req['headers']['x-bluebox-authorization']);
      if(isDecodeMode) {
        await getHeaderProxyTarget(req.headers, req.path).then(response => {
          proxyTarget = response;
        }).catch(error => {
          console.log(error)
          res.send(error);
        });

        await forwardRequest(req, proxyTarget, true).then(response => {
          let statusCode = (response.statusCode)? response.statusCode : 200;
          res.status(statusCode).send(response);
        }).catch(error => {
          let statusCode = (error.statusCode)? error.statusCode : 500;
          res.status(statusCode).send(error);
        });
      } else {
        res.status(401).send({"message": "Bluebox access denied."})
      }
    } else {
      await forwardRequest(req, proxyTarget, false).then(response => {
        let statusCode = (response.statusCode)? response.statusCode : 200;
        res.status(statusCode).send(response);
      }).catch(error => {
        let statusCode = (error.statusCode)? error.statusCode : 500;
        res.status(statusCode).send(error);
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
    try {
      if(typeof headers['x-bluebox-forward-to'] !== 'undefined' && headers['x-bluebox-forward-to'] != null) {
        resolve(headers['x-bluebox-forward-to'] + path.substring(1));
      } else {
        reject({"message": "Invalid x-bluebox-forward-to header. Please set a proxy target."});
      }
    } catch(e) {
      console.log(e);
      reject(e);
    }
  });
}

async function redirectOn302(body, response, resolveWithFullResponse) {
  if (response.statusCode === 302) {
    request.url = response.request.uri.href;
    let newResponse = await sendRequest(request);
    return newResponse.body
  } else {
    return resolveWithFullResponse ? response.body : body;
  }
}

async function forwardRequest(req, proxyTarget, isDecodeMode) {
  return new Promise(async function(resolve, reject) {
    try {
      delete req.headers.host;
      delete req.headers['content-length'];
      delete req.headers['x-bluebox-authorization'];
      delete req.headers['x-bluebox-forward-to'];
      
      let request = {
        url: proxyTarget,
        method: req.method,
        json: true,
        headers: req.headers,
        followAllRedirects: true,
        transform: redirectOn302
      }
    
      //Intercept and forward the querystrings
      if(typeof req.query !== 'undefined' && req.query != null && isEmpty(req.query) == false){
        request['qs'] = req.query;
      }
    
      //Intercept and forward the path parameters
      if(typeof req.params !== 'undefined' && req.params != null && isEmpty(req.params) == false){
        request['url'] = await urlParamsFiller(request['url'], req.params);
      }
    
      //Intercept and forward the request body
      if(typeof req.body !== 'undefined' && req.body != null && isEmpty(req.body) == false) {
        request['body'] = req.body;
      }
    
      request = await bluebox.blueboxReplacer(isDecodeMode, request); //decode sensitive data
      
      await sendRequest(request)
      .then(response => {
        resolve(response);
      }).catch(err => {
        console.log(err);
        if(typeof err.response !== 'undefined') {
          reject(err.response);
        } else {
          reject(err);
        }
      });
    } catch(e) {
      console.log(e);
      reject(e);
    }
  });
}