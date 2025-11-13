// cart-ms.js - starts the cart microservice
require('dotenv').config();
const path = require('path');
const DbUtil = require(path.join(__dirname, '..', 'database', 'connection'));

const { createApp } = require(path.join(__dirname, '..', 'server'));

const PORT = process.env.CART_PORT || process.env.PORT || 4002;

DbUtil.connect();
const app = createApp(['cart']);

app.listen(PORT, () => {
  console.log(`Cart microservice started on port ${PORT}`);
});
