const express = require('express');
const router = express.Router();
const connection = require('../db')

router.get('/user/:userId', (req, res) => {
  console.log(req.params);

  const userId = req.params.userId.trim();
  console.log('UID nettoyé:', userId);

  const query = 'SELECT id FROM Users WHERE uid = ?';
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du user :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.status(200).json({ id: results[0].id });
  });
});

module.exports = router;
