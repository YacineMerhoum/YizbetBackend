const express = require('express')
const router = express.Router()
const connection = require('../db')

// Route pour récupérer les données de match_odds
router.get('/match-odds', (req, res) => {
    const sql = 'SELECT * FROM match_odds'
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des données:', err)
            res.status(500).send('Erreur serveur')
            return
        }
        res.json(results)
    });
});

router.put('/match-odds/:id', (req, res) => {
    const { id } = req.params
    const { prediction } = req.body
    const query = 'UPDATE match_odds SET prediction = ? WHERE id = ?'
    connection.query(query, [prediction, id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du pronostic' })
      }
      res.json({ success: true })
    })
  })
  

module.exports = router
