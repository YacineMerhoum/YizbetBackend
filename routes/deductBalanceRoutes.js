const express = require('express')
const router = express.Router()
const connection = require('../db')

// Route pour déduire des tokens de la balance utilisateur
router.post('/deduct-balance', (req, res) => {
  console.log('Données reçues:', req.body)

  const { userId, amount } = req.body


  if (!userId || !amount) {
    return res.status(400).json({ error: 'Requête invalide. userId ou amount manquant.' })
  }


  const userIdQuery = 'SELECT id FROM users WHERE uid = ?';
  const query = 'UPDATE tokens SET balance = balance - ? WHERE user_id = ? AND balance >= ?'

  connection.query(userIdQuery, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', err)
      return res.status(500).json({ error: 'Erreur interne du serveur.' })
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' })
    }

    const userDbId = results[0].id


    connection.query(query, [amount, userDbId, amount], (err, results) => {
      if (err) {
        console.error('Erreur lors de la déduction des tokens:', err)
        return res.status(500).json({ error: 'Erreur interne du serveur.' })
      }

      if (results.affectedRows === 0) {
        return res.status(400).json({ error: 'Solde insuffisant ou utilisateur non trouvé.' })
      }

      res.status(200).json({ message: 'Tokens déduits avec succès.' })
    })
  })
})

module.exports = router
