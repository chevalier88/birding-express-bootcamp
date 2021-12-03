import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

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
app.use(cookieParser());

app.get('/signup', (request, response) => {
  console.log('signup form GET request came in');

  const getSignupFormQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0]);
    response.render('signupForm');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * FROM users', getSignupFormQuery);
});

app.post('/signup', (request, response) => {
  console.log('signup form post request came in');
  const formData = request.body;
  console.log(formData);

  const { email } = formData;
  const { password } = formData;

  const postSignupFormQuery = `
  INSERT INTO users (email, password)
  VALUES ('${email}', '${password}');
  `;
  console.log(postSignupFormQuery);
  const postSignupFormQueryResult = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result);
      return;
    }
    console.log(result);

    response.redirect('/');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query(postSignupFormQuery, postSignupFormQueryResult);
});

app.get('/login', (request, response) => {
  console.log('signup form GET request came in');

  const getSignupFormQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0]);
    response.render('login');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * FROM users', getSignupFormQuery);
});

app.post('/login', (request, response) => {
  console.log('request came in');

  const values = [request.body.email];

  pool.query('SELECT * from users WHERE email=$1', values, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    if (result.rows.length === 0) {
      // we didnt find a user with that email.
      // the error for password and user are the same.
      // don't tell the user which error they got for security reasons, otherwise
      // people can guess if a person is a user of a given service.
      response.status(403).send('sorry!');
      return;
    }

    const user = result.rows[0];

    if (user.password === request.body.password) {
      response.cookie('loggedIn', true);
      response.cookie('userId', user.id);
      response.redirect('/');
      // setTimeout(response.redirect('/'), 2000);
    } else {
      // password didn't match
      // the error for password and user are the same...
      response.status(403).send('sorry!');
    }
  });
});

app.get('/logout', (request, response) => {
  console.log('logging out');
  console.log(request);
  response.clearCookie('loggedIn');
  response.clearCookie('userId');
  response.redirect('/login');
});

app.get('/note', (request, response) => {
  console.log('note form get request came in');
  console.log(typeof (request.cookies.userId));
  const getBirdFormQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
    } else {
      const data = {
        species: result.rows,
      };
      console.log(result.rows);
      response.render('noteForm', data);
    }
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * FROM species', getBirdFormQuery);
});

app.post('/note', (request, response) => {
  console.log('note form post request came in');
  const formData = request.body;
  console.log('printing formData...');
  console.log(formData);

  const { date } = formData;
  const { behaviour } = formData;
  const flockSize = formData.flock_size;
  const { appearance } = formData;
  const cookieUserId = Number(request.cookies.userId);
  const speciesId = formData.species_id;

  console.log(cookieUserId);
  // response.send(formData);
  const postBirdFormQuery = `
  INSERT INTO birds (date, behaviour, flock_size, appearance, user_id, species_id)
  VALUES ('${date}', '${behaviour}', ${flockSize}, '${appearance}', ${cookieUserId}, ${speciesId});
  `;
  console.log(postBirdFormQuery);
  const postBirdFormQueryResult = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result);
      return;
    }
    console.log(result);

    response.redirect('/');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query(postBirdFormQuery, postBirdFormQueryResult);
});

app.get('/note/:id', (request, response) => {
  console.log('indiv note request came in');

  console.log(request.params.id);

  // const getBirdNoteIndexQuery = `
  // SELECT * FROM birds WHERE id=${request.params.id};`;

  // inner join to get all the deets from the 3 tables
  const getBirdNoteIndexQuery = `
  SELECT birds.id, birds.flock_size, birds.date, birds.appearance, birds.behaviour, users.email, species.name AS species FROM birds INNER JOIN users ON birds.user_id = users.id INNER JOIN species ON species.id = birds.species_id WHERE birds.id = ${request.params.id}`;
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
        species: result.rows[0].species,
        email: result.rows[0].email,
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
  if (request.cookies.loggedIn === 'true') {
    // const getAllBirdNotesQuery = `
    // SELECT * FROM birds;`;

    const getAllBirdNotesQuery = `
    SELECT birds.id, birds.behaviour, birds.flock_size, birds.user_id, birds.species_id, birds.date, species.name 
    FROM birds 
    INNER JOIN species 
    ON birds.species_id = species.id;`;

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
  } else {
    response.status(403).send('sorry, please log in!');
  }
});

app.listen(PORT);

console.log(`listening on port ${PORT}`);
