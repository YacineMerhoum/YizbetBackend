const express = require('express')
const router = express.Router()
const connection = require('../db')

router.get('/current-credit/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(userId, " je suis l'utilisateur")

  const query = 'SELECT amount AS currentCredit FROM payments WHERE user_id = ?'

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du crédit actuel :', err)
      return res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' })
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun crédit trouvé pour cet utilisateur' })
    }

    console.log(results, "credit du user")
    const currentCredit = results[0].currentCredit / 100

    res.status(200).json({ currentCredit })
  })
})

module.exports = router
