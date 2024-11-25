const express = require('express')
const router = express.Router()
const connection = require('../db')

router.get('/api/get-user-id/:userId', (req, res) => {
  const userId = req.params.userId
  console.log('Requête reçue pour l\'UID:', userId)

  const query = 'SELECT id FROM users WHERE uid = ?'
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du user:', err)
      return res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' })
    }
    
    console.log('Résultats SQL:', results)
    if (results.length === 0) {
      console.log('Utilisateur non trouvé pour l\'UID:', userId)
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    const user = results[0]
    res.status(200).json(user)
  });
});

module.exports = router
