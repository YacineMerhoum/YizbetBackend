const express = require('express');
const router = express.Router();
const connection = require('../db');
const { getTotalBalance } = require('../Controller/tokenController');

// Route pour récupérer le crédit actuel d'un utilisateur
router.get('/current-credit/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT amount AS currentCredit FROM Payments WHERE user_id = ?';

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du crédit actuel :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun crédit trouvé pour cet utilisateur' });
    }

    const currentCredit = results[0].currentCredit / 100;
    res.status(200).json({ currentCredit });
  });
});

// Route pour récupérer la balance actuelle
router.get('/current-balance/:userId', (req, res) => {
  const userId = req.params.userId;
  const userQuery = 'SELECT * FROM Users WHERE uid = ?';

  connection.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du user :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération du user' });
    }

    const user = results[0];
    const query = 'SELECT balance AS currentBalance FROM Tokens WHERE user_id = ?';

    connection.query(query, [user.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération de la balance actuelle :', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération de la balance actuelle' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Aucun crédit trouvé pour cet utilisateur' });
      }

      const currentBalance = results[0].currentBalance / 100;
      res.status(200).json({ currentBalance, user });
    });
  });
});

// Route pour récupérer le total de la balance
router.get('/total-balance/:userId', async (req, res) => {
  try {
    const firebaseUid = req.params.userId;
    const totalBalance = await getTotalBalance(firebaseUid, connection);
    res.json({ totalBalance });
  } catch (error) {
    console.error('Error fetching total balance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route pour déduire la balance
router.post('/deduct-balance', (req, res) => {
  const { userId, amount } = req.body;
  const userIdQuery = 'SELECT id FROM Users WHERE uid = ?';
  const query = 'UPDATE Tokens SET balance = balance - ? WHERE user_id = ? AND balance >= ?';

  connection.query(userIdQuery, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const userDbId = results[0].id;
    connection.query(query, [amount, userDbId, amount], (err, results) => {
      if (err) {
        console.error('Erreur lors de la déduction des tokens:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.affectedRows === 0) {
        return res.status(400).json({ error: 'Solde insuffisant ou utilisateur non trouvé.' });
      }

      res.status(200).json({ message: 'Tokens déduits avec succès.' });
    });
  });
});

module.exports = router;
