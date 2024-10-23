const express = require('express');
const router = express.Router();
const connection = require('../db')


router.get('/current-balance/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(userId + " est l'ID du User");

  const userQuery = "SELECT * FROM Users WHERE uid = ?";

  // Récupérer les informations de l'utilisateur
  connection.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du user :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération du user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = results[0]; // Utilisateur récupéré

    // Récupérer la balance actuelle de l'utilisateur
    const balanceQuery = 'SELECT balance AS currentBalance FROM Tokens WHERE user_id = ?';
  
    connection.query(balanceQuery, [user.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération de la balance actuelle :', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération de la balance actuelle' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Aucun crédit trouvé pour cet utilisateur' });
      }

      console.log(results, "balance du user");
      const currentBalance = results[0].currentBalance / 100;

      // Réponse avec la balance actuelle et les informations de l'utilisateur
      res.status(200).json({ currentBalance, user });
    });
  });
});



module.exports = router;
