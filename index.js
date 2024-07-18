const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');
const mysql = require('mysql2');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const paymentController = require('./Controller/paymentController');
const currentUser = require('./Middlewares/currentUser');

const app = express();
const PORT = 3008;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Yizbet'
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données MySQL !');
});

// Configurer CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));

// Configurer express-session
const sessionStore = new MySQLStore({}, connection);
app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 jour
}));

// Configurer express.raw pour le webhook Stripe
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => paymentController.webhookHandler(req, res, connection));

app.use(bodyParser.json());

app.post('/create-checkout-session', (req, res) => paymentController.createCheckoutSession(req, res, connection));



// Route pour récupérer le crédit ( le nombre de tokens) actuel d'un utilisateur
app.get('/current-credit/:userId', (req, res) => {
  const userId = currentUser.getCurrentUser();
  console.log(userId, " je suis l'utilisateur");

  const query = 'SELECT amount AS currentCredit FROM Payments WHERE user_id = ?';

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du crédit actuel :', err);
      res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: 'Aucun crédit trouvé pour cet utilisateur' });
      return;
    }
    console.log(results , "credit du user");
    const currentCredit = results[0].currentCredit;

    res.status(200).json({ currentCredit });
  });
});



// Route d'inscription
app.post('/register', async (req, res) => {
  const { email, pseudo, dob, uid, password, google } = req.body;

  if (google) {
    try {
      const query = 'INSERT INTO Users (email, pseudo, uid) VALUES (?, ?, ?)';
      connection.query(query, [email, pseudo, uid], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion des données :', err);
          res.status(500).json({ error: 'Erreur lors de l\'inscription' });
          return;
        }

        // Stocker l'ID utilisateur dans le module currentUser
        currentUser.setCurrentUser(results.insertId);

        res.status(201).json({ message: 'Inscription réussie !', userId: results.insertId });
      });
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe :', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  } else {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const query = 'INSERT INTO Users (email, pseudo, dob, uid, password) VALUES (?, ?, ?, ?, ?)';
      connection.query(query, [email, pseudo, dob, uid, hashedPassword], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion des données :', err);
          res.status(500).json({ error: 'Erreur lors de l\'inscription' });
          return;
        }

        // Stocker l'ID utilisateur dans le module currentUser
        currentUser.setCurrentUser(results.insertId);

        res.status(201).json({ message: 'Inscription réussie !', userId: results.insertId });
      });
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe :', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }
});

const matchesRoute = require('./routes/matchesRoute');
app.use(matchesRoute, express.json());

app.use('/data', express.static(path.join(__dirname, 'data')));

async function fetchMatchesData() {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches/",
      {
        headers: {
          "X-Auth-Token": "1a93aed1ddfe4d9c9e8b0e6b493ee91c"
        }
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données des matches :', error);
  }
}

cron.schedule('0 * * * *', fetchMatchesData);

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
