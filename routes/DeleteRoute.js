const express = require('express');
const router = express.Router();
const connection = require('../db');

router.delete('/delete-account/:userId', (req, res) => {
  const { userId } = req.params;

  // Supprimer les prédictions de l'utilisateur
  const deleteUserPredictionsQuery = 'DELETE FROM UserPredictions WHERE user_id = ?';

  // Supprimer les tokens de l'utilisateur
  const deleteTokensQuery = 'DELETE FROM Tokens WHERE user_id = ?';

  // Supprimer les paiements de l'utilisateur
  const deletePaymentsQuery = 'DELETE FROM Payments WHERE user_id = ?';

  // Supprimer l'utilisateur
  const deleteUserQuery = 'DELETE FROM Users WHERE id = ?';

  // Commencer par supprimer les enregistrements liés dans chaque table
  connection.query(deleteUserPredictionsQuery, [userId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la suppression des prédictions :", err);
      return res.status(500).json({ error: 'Erreur lors de la suppression des prédictions' });
    }

    connection.query(deleteTokensQuery, [userId], (err, results) => {
      if (err) {
        console.error("Erreur lors de la suppression des tokens :", err);
        return res.status(500).json({ error: 'Erreur lors de la suppression des tokens' });
      }

      connection.query(deletePaymentsQuery, [userId], (err, results) => {
        if (err) {
          console.error("Erreur lors de la suppression des paiements :", err);
          return res.status(500).json({ error: 'Erreur lors de la suppression des paiements' });
        }

        // Enfin, supprimer l'utilisateur lui-même
        connection.query(deleteUserQuery, [userId], (err, results) => {
          if (err) {
            console.error("Erreur lors de la suppression de l'utilisateur :", err);
            return res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
          }

          res.status(200).json({ message: 'Compte utilisateur supprimé avec succès' });
        });
      });
    });
  });
});

module.exports = router;
