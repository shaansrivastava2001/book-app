// users-ms.js - starts the users microservice
require('dotenv').config();
const path = require('path');
const DbUtil = require(path.join(__dirname, '..', 'database', 'connection'));

const { createApp } = require(path.join(__dirname, '..', 'server'));

const PORT = process.env.USERS_PORT || process.env.PORT || 4000;

// Connect DB then create app with only users routes mounted
DbUtil.connect();
const app = createApp(['users']);

app.listen(PORT, () => {
  console.log(`Users microservice started on port ${PORT}`);
});
