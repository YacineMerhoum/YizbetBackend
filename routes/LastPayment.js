const express = require('express')
const router = express.Router()
const connection = require('../db')

router.get('/:userId', (req, res) => { 
  const { userId } = req.params

  const query = `
    SELECT amount 
    FROM payments 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du dernier paiement :', err)
      return res.status(500).json({ error: 'Erreur lors de la récupération du dernier paiement' })
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun paiement trouvé pour cet utilisateur' })
    }

    const lastPayment = results[0]
    res.status(200).json({ amount: lastPayment.amount })
  })
})

module.exports = router
