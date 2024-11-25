const express = require("express")
const router = express.Router()
const connection = require("../db")

// Route pour ajouter une prédiction user
router.post("/api/userpredictions", (req, res) => {
  const { user_id, match_id, prediction, tokens_used } = req.body;

  console.log("Vérification de l'utilisateur avec ID:", user_id)

  // Requête pour vérifier si l'utilisateur existe
  const userCheckSql = "SELECT * FROM users WHERE id = ?"
  connection.query(userCheckSql, [user_id], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'utilisateur:", err)
      return res
        .status(500)
        .json({
          success: false,
          error: "Erreur lors de la vérification de l'utilisateur",
        })
    }

    if (results.length === 0) {
      console.error("Utilisateur non trouvé avec ID:", user_id)
      return res
        .status(404)
        .json({ success: false, error: "Utilisateur non trouvé" })
    }

    // Requête pour insérer la prédiction
    const sql =
      "INSERT INTO user_predictions (user_id, match_id, prediction, tokens_used) VALUES (?, ?, ?, ?)"
    connection.query(
      sql,
      [user_id, match_id, prediction, tokens_used],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de l'insertion du pronostic:", err)
          return res
            .status(500)
            .json({
              success: false,
              error: "Erreur lors de l'insertion du pronostic",
            })
        }

        res.status(201).json({ success: true, id: result.insertId })
      }
    )
  })
})

// Route pour accéder à l'historique des prédictions d'un utilisateur
router.get("/api/userpredictions/:userId", (req, res) => {
  const { userId } = req.params;

  // Requête pour récupérer les prédictions de l'utilisateur
  const query = "SELECT * FROM user_predictions WHERE user_id = ?"
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des prédictions :", err);
      return res
        .status(500)
        .send("Erreur lors de la récupération des prédictions")
    }


    res.json(results)
  })
})

module.exports = router
