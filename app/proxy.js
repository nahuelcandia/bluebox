const rp = require('request-promise');

exports.redirectRequest = async function (req, res, next) {

  var proxyTarget = process.env.PROXY_TARGET + req.path;

  var options = {
    url: proxyTarget,
    method: req.method,
    json: true,
    headers: {},
    followAllRedirects: true
  }
  console.log(options)
  //Querystring
  if(typeof req.query !== 'undefined' && req.query != null && isEmpty(req.query) == false){
    options['qs'] = req.query;
  }

  // Params
  if(typeof req.params !== 'undefined' && req.params != null && isEmpty(req.params) == false){
    options['url'] = urlParamsFiller(options['url'], req.params);
  }

  //Headers
  if(req.method == 'GET' && typeof req.get('Content-Type') !== 'undefined' && req.get('Content-Type') != null){
    options['headers'] = req.headers;
  }

  //Body
  if(typeof req.body !== 'undefined' && req.body != null && isEmpty(req.body) == false) {
    options['body'] = req.body;
  }

  // console.log(options)
  rp(options)
  .then(response => {
    res.send(response);
  }).catch(err => {
    console.log(err);
    if(typeof err.response !== 'undefined') {
      res.status(err.response.statusCode).send(err.response.body);
    } else {
      res.send(err);
    }
  });

}


function isEmpty(obj) {
  if(!Object.keys(obj).length > 0) {
    return true;
  } else {
    return false;
  }
}

function urlParamsFiller(string, params)  {
  for (const param of Object.keys(params)) {
    string = string.replace(`:${param}`, params[param]);
  }
  return string;
}