const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use('/unauthorized', (req, res) => {
  return res.status(401).json(req.body).send();
});

app.use('/badrequest', (req, res) => {
  return res.status(400).json(req.body).send();
});

app.use('/accepted', (req, res) => {
  return res.status(201).json(req.body).send();
});

app.all('*', (req, res) => {
  const response = {
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  }
  
  return res.json(response).send();
});

app.listen(9000, () => {
  console.log('Listening 9000')
});