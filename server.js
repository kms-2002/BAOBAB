// Vercel detects this root-level Express entrypoint and serves it as a Function.
require('express');
module.exports = require('./server/server');
