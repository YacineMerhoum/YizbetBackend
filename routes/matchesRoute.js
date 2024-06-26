// EURO 2024 MATCHS 

const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");

const router = express.Router();

const dataDir = path.resolve(__dirname, "../data");
router.use("/data", express.static(dataDir));

async function fetchDataAndSaveToFile() {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/EC/matches",
      {
        headers: {
          "X-Auth-Token": "1a93aed1ad8b40d1af324616d76267c1",
        },
      }
    );
    const data = response.data;

    const updatedData = {
      updatedAt: new Date().toISOString(),
      data: data,
    };

    const dataDir = path.resolve(__dirname, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, "matchesRoute.json");
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    console.log(`Données enregistrées dans ${filePath}`);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération et de l'enregistrement des données :",
      error
    );
  }
}

cron.schedule("0 0 * * *", () => {
  console.log(
    "Exécution de la tâche planifiée : récupération des données de la totalité de leuro24"
  );
  fetchDataAndSaveToFile();
});

router.get("/matches", (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "matchesRoute.json");
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
