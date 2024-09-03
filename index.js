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
const { getTotalBalance } = require('./Controller/tokenController')
const dashboardRoutes = require('./routes/Dashboard');
const balanceRoutes = require('./routes/balanceRoutes');
const lastPayment = require('./routes/LastPayment')
const deleteRoute = require('./routes/DeleteRoute')

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

module.exports = connection;

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

app.use('/api/admin', dashboardRoutes);

app.use('/api', balanceRoutes);

app.use('/api/last-payment', lastPayment);

app.use('/api', deleteRoute);





// app.get('/user/:userId', (res, req)=>{
//   console.log(req.params)
//   // Première requête pour obtenir l'ID utilisateur à partir du uid Firebase
//   const userId = req.params.userId
//   const query = 'SELECT id FROM Users WHERE uid = ?';
//   connection.query(query, [userId], (err, results) => {
//     if (err) {
//       console.error('Erreur lors de la récupération du user :', err);
//       res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' });
//       return;
//     }
    
//     const user= results

//     res.status(200).json(user);
//   });
// })
app.get('/user/:userId', (req, res) => {
  console.log(req.params);


  const userId = req.params.userId.trim();
  console.log('UID nettoyé:', userId);
  
  const query = 'SELECT id FROM Users WHERE uid = ?';
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du user :', err);
      res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' });
      return;
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ id: results[0].id });
  });
});






// app.get('/api/get-user-id/:userId', (req, res) => {
//   const userId = req.params.userId;
//   console.log('Requête reçue pour l\'UID:', userId);

//   const query = 'SELECT id FROM Users WHERE uid = ?';
//   connection.query(query, [userId], (err, results) => {
//       if (err) {
//           console.error('Erreur lors de la récupération du user:', err);
//           return res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' });
//       }
      
//       console.log('Résultats SQL:', results);
//       if (results.length === 0) {
//           console.log('Utilisateur non trouvé pour l\'UID:', userId);
//           return res.status(404).json({ error: 'Utilisateur non trouvé' });
//       }

//       const user = results[0];
//       res.status(200).json(user);
//   });
// });






// Route pour récupérer le crédit ( le nombre de tokens) actuel d'un utilisateur
app.get('/current-credit/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(userId, " je suis l'utilisateur");

  const query = 'SELECT amount AS currentCredit FROM Payments WHERE user_id = ?';

  connection.query(query, [user.id], (err, results) => {
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
    const currentCredit = results[0].currentCredit/100

    res.status(200).json({ currentCredit });
  });
});

// TEST POUR CREDIT TOTAL DU USER

app.get('/current-balance/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(userId + " " + "est l'ID du User");

  const userQuery = "SELECT * FROM Users WHERE uid = ?"  
  connection.query(userQuery, [userId], (err, results) => {
    console.log(results);
    if (err) {
      console.error('Erreur lors de la récupération du user :', err);
      res.status(500).json({ error: 'Erreur lors de la récupération du user' });
      return;
    }
    const user = results[0]; 

    const query = 'SELECT balance AS currentBalance FROM Tokens WHERE user_id = ?';
  
    connection.query(query, [user.id], (err, results) => {
      console.log(results);
      if (err) {
        console.error('Erreur lors de la récupération de la balance actuelle :', err);
        res.status(500).json({ error: 'Erreur lors de la récupération de la balance actuelle' });
        return;
      }
      
      if (results.length === 0) {
        res.status(404).json({ error: 'Aucun crédit trouvé pour cet utilisateur' });
        return;
      }
      console.log(results, "balance du user");
      const currentBalance = results[0].currentBalance / 100; 
  
      res.status(200).json({ currentBalance, user });
    });
  });

});


// ROUTE POUR FETCH LES PRONOS POUR LA PAGE GAMESEXOTICS en front 

app.get('/api/match-odds', (req, res) => {
  const sql = 'SELECT id, prediction FROM match_odds ORDER BY insertion_order LIMIT 6'
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur de la requête SQL:', err);
      res.status(500).send('Erreur serveur');
      return;
    }
    res.send(results);
  });
});



// Interrogons la BDD pour savoir si le nombre de Tokens est bon
app.get('/total-balance/:userId', async (req, res) => {
  try {
    const firebaseUid = req.params.userId; // Il s'agit ici du uid Firebase
    console.log('User ID dans la route:', firebaseUid);
    const totalBalance = await getTotalBalance(firebaseUid, connection);
    console.log('Total Balance:', totalBalance);
    res.json({ totalBalance });
  } catch (error) {
    console.error('Error fetching total balance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Route pour déduire les tokens de l'utilisateur
app.post('/deduct-balance', (req, res) => {
  console.log('Données reçues:', req.body); // Ajoutez ce log pour voir les données

  const { userId, amount } = req.body;

  if (!userId || !amount) {
      return res.status(400).json({ error: 'Invalid request. Missing userId or amount.' });
  }

  // Première requête pour obtenir l'ID utilisateur à partir du uid Firebase
  const userIdQuery = 'SELECT id FROM Users WHERE uid = ?';
  const query = 'UPDATE Tokens SET balance = balance - ? WHERE user_id = ? AND balance >= ?';

  connection.query(userIdQuery, [userId], (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération de l\'ID utilisateur:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      const userDbId = results[0].id;

      connection.query(query, [amount, userDbId, amount], (err, results) => {
          if (err) {
              console.error('Erreur lors de la déduction des tokens:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }

          if (results.affectedRows === 0) {
              return res.status(400).json({ error: 'Solde insuffisant ou utilisateur non trouvé.' });
          }

          res.status(200).json({ message: 'Tokens déduits avec succès.' });
      });
  });
});


// POUR ENRENGISTRER EN BDD LE PRONO DU USER POUR QUE SA LAISSE UNE TRACE

app.post('/api/userpredictions', (req, res) => {
  const { user_id, match_id, prediction, tokens_used } = req.body;

  console.log('Vérification de l\'utilisateur avec ID:', user_id);

  const userCheckSql = 'SELECT * FROM Users WHERE id = ?';
  connection.query(userCheckSql, [user_id], (err, results) => {
      if (err) {
          console.error('Erreur lors de la vérification de l\'utilisateur:', err);
          return res.status(500).json({ success: false, error: 'Erreur lors de la vérification de l\'utilisateur' });
      }

      console.log('Résultat de la requête utilisateur:', results);

      if (results.length === 0) {
          console.error('Utilisateur non trouvé avec ID:', user_id);
          return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }

      const sql = 'INSERT INTO UserPredictions (user_id, match_id, prediction, tokens_used) VALUES (?, ?, ?, ?)';
      connection.query(sql, [user_id, match_id, prediction, tokens_used], (err, result) => {
          if (err) {
              console.error('Erreur lors de l\'insertion du pronostic:', err);
              return res.status(500).json({ success: false, error: 'Erreur lors de l\'insertion du pronostic' });
          }

          res.status(201).json({ success: true, id: result.insertId });
      });
  });
});

// ACCES AUX HISTORIQUES PRONOS 
app.get('/api/userpredictions/:userId', (req, res) => {
  const { userId } = req.params;

  const query = 'SELECT * FROM UserPredictions WHERE user_id = ?';
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des prédictions :", err);
      return res.status(500).send('Erreur lors de la récupération des prédictions');
    }

    res.json(results);
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

        res.status(201).json({ message: 'Inscription réussie !', userId: results.insertId });
      });
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe :', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }
});

const matchesRoute = require('./routes/matchesRoute');
const { log } = require('console');
app.use(matchesRoute, express.json());

app.use('/data', express.static(path.join(__dirname, 'data')));

async function fetchMatchesData() {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches/",
      {
        headers: {
          "X-Auth-Token": "1a93aed1ad8b40d1af324616d76267c1"
        }
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données des matches :', error);
  }
}
// cron.schedule('*/10 * * * * *', fetchMatchesData);
cron.schedule('0 * * * *', fetchMatchesData);

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

