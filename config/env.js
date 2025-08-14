const path = require('path');
const dotenv = require('dotenv');

// Load local .env once for the whole app
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// Optionally, set defaults
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

module.exports = {}; 