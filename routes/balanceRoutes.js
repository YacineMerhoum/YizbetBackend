const express = require('express')
const router = express.Router()
const connection = require('../db')

router.get('/user-amount/:userId', (req, res) => {
  const userId = req.params.userId

  const query = 'SELECT balance FROM tokens WHERE user_id = ?'

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du montant :', err)
      return res.status(500).json({ error: 'Erreur lors de la récupération du montant' })
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun montant trouvé pour cet utilisateur' })
    }

    const totalAmount = results[0].balance
    console.log('Total Amount:', totalAmount)
    res.json({ totalAmount })
  });
});

module.exports = router
