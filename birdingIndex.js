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

  const { date } = formData;
  const { behaviour } = formData;
  const flockSize = formData.flock_size;
  const { appearance } = formData;

  const postBirdFormQuery = `
  INSERT INTO birds (date, behaviour, flock_size, appearance)
  VALUES ('${date}', '${behaviour}', ${flockSize}, '${appearance}');
  `;
  console.log(postBirdFormQuery);
  const postBirdFormQueryResult = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result);
      return;
    }
    console.log(result);

    response.send('birdwatching form new note submitted! SQL Table has been updated...');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query(postBirdFormQuery, postBirdFormQueryResult);
});

app.get('/note/:id', (request, response) => {
  console.log('indiv note request came in');

  console.log(request.params.id);

  const getBirdNoteIndexQuery = `
  SELECT * FROM birds WHERE id=${request.params.id};`;

  console.log(getBirdNoteIndexQuery);

  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0]);
    const content = {
      noteIndex: {
        id: result.rows[0].id,
        date: result.rows[0].date,
        behaviour: result.rows[0].behaviour,
        flock_size: result.rows[0].flock_size,
        appearance: result.rows[0].appearance,
      },
    };
    console.log(content);
    // response.send(result.rows[0]);
    response.render('noteIndex', content);
  };

  // Query using pg.Pool instead of pg.Client
  pool.query(getBirdNoteIndexQuery, whenDoneWithQuery);
});

app.get('/', (request, response) => {
  console.log('indiv note request came in');

  const getAllBirdNotesQuery = `
  SELECT * FROM birds;`;

  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows);
    const content = {
      allSightings: result.rows,
    };
    // response.send(content);
    response.render('allNotes', content);
  };

  // Query using pg.Pool instead of pg.Client
  pool.query(getAllBirdNotesQuery, whenDoneWithQuery);
});

app.listen(PORT);

console.log(`listening on port ${PORT}`);
