const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3007;

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

app.use(cors());
app.use(bodyParser.json());

app.post('/register', async (req, res) => {
  const { email, pseudo, dob, uid , password, google } = req.body;

  if (google) {
    try {
      // Insérer les données dans la base de données
      const query = 'INSERT INTO Users (email, pseudo, uid) VALUES (?, ?, ?)';
      connection.query(query, [email, pseudo, uid], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion des données :', err);
          res.status(500).json({ error: 'Erreur lors de l\'inscription' });
          return;
        }
        res.status(201).json({ message: 'Inscription réussie !' });
      });
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe :', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }else{
    try {
      // Hachage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insérer les données dans la base de données
      const query = 'INSERT INTO Users (email, pseudo, dob, uid, password) VALUES (?, ?, ?, ?, ?)';
      connection.query(query, [email, pseudo, dob, uid, hashedPassword], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion des données :', err);
          res.status(500).json({ error: 'Erreur lors de l\'inscription' });
          return;
        }
        res.status(201).json({ message: 'Inscription réussie !' });
      });
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe :', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }
});

// Chargement des routes
const matchesRoute = require('./routes/matchesRoute');
app.use(matchesRoute, express.json());

// Middleware pour servir des fichiers statiques depuis le dossier 'data'
app.use('/data', express.static(path.join(__dirname, 'data')));




// Endpoint pour récupérer les données des matches depuis l'API
async function fetchMatchesData() {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches/",
      {
        headers: {
          "X-Auth-Token": "1a93aed1ad8b40d1af324616d76267c1",
        },
      }
    );
    console.log('Données récupérées de l\'API :', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
    throw error;
  }
}

// Fonction pour traiter et enregistrer les données des matches dans un fichier JSON
async function fetchAndProcessMatchesData() {
  try {
    const data = await fetchMatchesData();
    console.log("La requête API des matches a fonctionné !");

    const updatedData = {
      updatedAt: new Date().toISOString(),
      matches: data.matches 
    };

    // Assurez-vous que le dossier 'data' existe, sinon, créez-le
    const dataDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Enregistrer les données dans un fichier JSON
    const filePath = path.join(dataDir, 'matches.json');
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2)); // Correction ici

    console.log(`Données des matches enregistrées dans ${filePath}`);
  } catch (error) {
    console.error('Erreur lors de la récupération et de l\'enregistrement des données :', error);
  }
}


// POUR TOUTES LES 10 SECONDE ICI => cron.schedule('*/10 * * * * *', () => {


cron.schedule('0 * * * *', () => {
  console.log('Exécution de la tâche planifiée : récupération des données des matches du jour !');
  fetchAndProcessMatchesData();
});

// Endpoint pour récupérer les données des matches depuis le fichier JSON
app.get('/api/matches', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'matches.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(data);  // Parse les données JSON

    res.json(jsonData);  // Envoyer la réponse JSON au client
  } catch (error) {
    console.error('Erreur lors de la récupération des données depuis le fichier JSON :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});


app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});


const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Dossier "data" créé avec succès');
}
