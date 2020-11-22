const serverless = require('serverless-http');
var express = require('express');
require('dotenv').config();
var inboundProxy = require('./proxy');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
var cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
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

module.exports.proxy = serverless(app);