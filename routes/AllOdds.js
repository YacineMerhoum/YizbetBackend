const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");

const router = express.Router();

const apiKey = "90c75e4ec804f6d9a3f0d30592ea7d03";

const dataDir = path.resolve(__dirname, "../data");
router.use("/data", express.static(dataDir));

async function fetchDataAndSaveToFile() {
  try {
    const response = await axios.get(
      "https://api.the-odds-api.com/v4/sports/soccer/odds?regions=eu&oddsFormat=decimal&apiKey=" +
        apiKey
    );
    const data = response.data;

    const updatedData = {
      updatedAt: new Date().toISOString(),
      data: data,
    };

    // Vérifier l'existence du répertoire de données
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, "matchesOdds.json");
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    console.log(`Données enregistrées dans ${filePath}`);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération et de l'enregistrement des données :",
      error
    );
  }
}
// cron.schedule('*/10 * * * * *', () => {
cron.schedule('0 0 * * *', () => {
  console.log(
    "Exécution de la tâche planifiée : récupération des données des côtes"
  );
  fetchDataAndSaveToFile();
});

router.get("/matchesOdds", (req, res) => {
  try {
    const filePath = path.join(dataDir, "matchesOdds.json");
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
