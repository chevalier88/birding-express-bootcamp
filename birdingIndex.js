import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'grahamlim',
  host: 'localhost',
  database: 'birdwatching',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

const app = express();

const PORT = 3008;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

app.get('/note', (request, response) => {
  console.log('note form get request came in');

  const getBirdFormQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0]);
    response.render('noteForm');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * FROM birds', getBirdFormQuery);
});

app.post('/note', (request, response) => {
  console.log('note form post request came in');

  const formData = request.body;
  console.log(formData);

  const postBirdFormQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0]);
    response.send('birdwatching form new note submitted!');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * FROM birds', postBirdFormQuery);
});

app.get('/', (request, response) => {
  console.log('request came in');

  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0].name);
    response.send(result.rows);
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * FROM birds', whenDoneWithQuery);
});

app.listen(PORT);

console.log(`listening on port ${PORT}`);
