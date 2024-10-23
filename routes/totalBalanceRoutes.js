const express = require('express');
const router = express.Router();
const connection = require('../db'); // Connexion à la base de données
const { getTotalBalance } = require('../Controller/tokenController'); // Assure-toi que la fonction getTotalBalance est exportée correctement

// Route pour obtenir le total des balances de l'utilisateur
router.get('/total-balance/:userId', async (req, res) => {
  try {
    const firebaseUid = req.params.userId; // UID Firebase de l'utilisateur
    console.log('User ID dans la route:', firebaseUid);

    // Appel de la fonction getTotalBalance pour obtenir le solde total
    const totalBalance = await getTotalBalance(firebaseUid, connection);
    console.log('Total Balance:', totalBalance);

    // Envoi de la réponse avec le solde total
    res.json({ totalBalance });
  } catch (error) {
    console.error('Error fetching total balance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
