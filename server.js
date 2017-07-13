// Set up DB instance
// var environment = process.env.NODE_ENV || 'development';
// var dbConfig = require('./knexfile.js')[process.env.NODE_ENV || 'development'];
// var db = require('knex')(dbConfig);

// This will be our application entry. We'll setup our server here.
const http = require('http');
const app = require('./server/express'); // The express app we just created

const port = parseInt(process.env.PORT, 10) || 8000;
app.set('port', port);

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});