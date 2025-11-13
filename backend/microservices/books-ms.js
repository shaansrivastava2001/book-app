// books-ms.js - starts the books microservice
require('dotenv').config();
const path = require('path');
const DbUtil = require(path.join(__dirname, '..', 'database', 'connection'));

const { createApp } = require(path.join(__dirname, '..', 'server'));

const PORT = process.env.BOOKS_PORT || process.env.PORT || 4003;

DbUtil.connect();
const app = createApp(['books']);

app.listen(PORT, () => {
  console.log(`Books microservice started on port ${PORT}`);
});
