const fs = require("fs")
const path = require("path")
const express = require("express")
const axios = require("axios")
const cron = require("node-cron")
const mysql = require("mysql2/promise")

const router = express.Router();

const apiKey = "90c75e4ec804f6d9a3f0d30592ea7d03"
const dataDir = path.resolve(__dirname, "../data")
router.use("/data", express.static(dataDir))

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Yizbet'
};

async function fetchDataAndSaveToFile() {
  try {
    const response = await axios.get(
      `https://api.the-odds-api.com/v4/sports/soccer/odds?regions=eu&oddsFormat=decimal&apiKey=${apiKey}`
    );
    const data = response.data;

    const updatedData = {
      updatedAt: new Date().toISOString(),
      data: data,
    };

    // Vérifier l'existence du répertoire de données
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const filePath = path.join(dataDir, "matchesOdds.json")
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))
    console.log(`Données enregistrées dans ${filePath}`)

    // Insérer les données dans la base de données
    await insertDataIntoDatabase(data)
  } catch (error) {
    console.error(
      "Erreur lors de la récupération et de l'enregistrement des données :",
      error
    );
  }
}

async function insertDataIntoDatabase(oddsData) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected to the database")

    // Filtrer les matchs de Pinnacle et garder seulement les 6 premiers
    const pinnacleMatches = oddsData.filter(match => 
      match.bookmakers.some(bookmaker => bookmaker.key === "pinnacle")
    ).slice(0, 6);

    let order = 1; // Initialiser l'ordre d'insertion
    for (const match of pinnacleMatches) {
      const { id, sport_key, sport_title, commence_time, home_team, away_team, bookmakers } = match

      const pinnacleBookmaker = bookmakers.find(bookmaker => bookmaker.key === "pinnacle")

      if (pinnacleBookmaker && pinnacleBookmaker.markets.length > 0) {
        const h2hMarket = pinnacleBookmaker.markets.find(market => market.key === "h2h")
        if (h2hMarket) {
          const outcomes = h2hMarket.outcomes;
          //Query delete all match before add
          const query = `
            INSERT INTO match_odds (id, sport_key, sport_title, commence_time, home_team, away_team, bookmaker_key, bookmaker_title, last_update, home_price, away_price, draw_price, insertion_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            last_update = VALUES(last_update),
            home_price = VALUES(home_price),
            away_price = VALUES(away_price),
            draw_price = VALUES(draw_price),
            insertion_order = VALUES(insertion_order)
          `; 

          await connection.execute(query, [
            id,
            sport_key,
            sport_title,
            commence_time,
            home_team,
            away_team,
            pinnacleBookmaker.key,
            pinnacleBookmaker.title,
            pinnacleBookmaker.last_update,
            outcomes.find(outcome => outcome.name === home_team)?.price || null,
            outcomes.find(outcome => outcome.name === away_team)?.price || null,
            outcomes.find(outcome => outcome.name === 'Draw')?.price || null,
            order++ 
          ]);
        }
      }
    }

    console.log("Data inserted into the database successfully");
    await connection.end();
  } catch (error) {
    console.error("Error inserting data into the database:", error);
  }
}


// cron.schedule('*/10 * * * * *', () => {
  cron.schedule('0 * * * *', () => {
  console.log(
    "Exécution de la tâche planifiée : récupération des données des côtes"
  );
  fetchDataAndSaveToFile();
});

router.get("/matchesOdds", (req, res) => {
  try {
    const filePath = path.join(dataDir, "matchesOdds.json");
    console.log(`Reading data from ${filePath}...`);
    const data = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données depuis le fichier JSON :",
      error
    );
    res.status(500).send("Erreur lors de la récupération des données");
  }
});

module.exports = router;
