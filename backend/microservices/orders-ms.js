// orders-ms.js - starts the orders microservice
require('dotenv').config();
const path = require('path');
const DbUtil = require(path.join(__dirname, '..', 'database', 'connection'));

const { createApp } = require(path.join(__dirname, '..', 'server'));

const PORT = process.env.ORDERS_PORT || process.env.PORT || 4001;

DbUtil.connect();
const app = createApp(['order']);

app.listen(PORT, () => {
  console.log(`Orders microservice started on port ${PORT}`);
});
