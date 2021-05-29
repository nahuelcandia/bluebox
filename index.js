const serverless = require('serverless-http');
const express = require('express');
const inboundProxy = require('./app/proxy');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(bodyParser.json());
//This will allow to receive multipart on any endpoint
app.use(upload.any());

app.use(morgan('dev'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); 
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  next();
});

// Intercept all requests
app.get('*', inboundProxy.redirectRequest);
app.put('*', inboundProxy.redirectRequest);
app.post('*', inboundProxy.redirectRequest);
app.delete('*', inboundProxy.redirectRequest);
app.patch('*', inboundProxy.redirectRequest);
app.options('*', inboundProxy.redirectRequest);

function expressApp(req,res, next) {
  if (!req.path) req.url = `/${req.url}`;
  return app(req,res, next);
}

module.exports.app = serverless(expressApp, {
  binary: ['image/*'],
  request: function (req, event, context) {
      context.callbackWaitsForEmptyEventLoop = false;
  }
});