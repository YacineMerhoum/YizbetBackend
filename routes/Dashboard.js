const express = require('express');
const router = express.Router();
const connection = require('../index'); // Assurez-vous que c'est le bon chemin pour votre fichier de connexion

// Route pour afficher tous les pronostics
router.get('/predictions', (req, res) => {
    const query = 'SELECT * FROM UserPredictions';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la récupération des prédictions' });
        }
        res.json(results);
    });
});

// Route pour ajouter un pronostic
router.post('/predictions', (req, res) => {
    const { user_id, match_id, prediction, tokens_used } = req.body;
    const query = 'INSERT INTO UserPredictions (user_id, match_id, prediction, tokens_used) VALUES (?, ?, ?, ?)';
    connection.query(query, [user_id, match_id, prediction, tokens_used], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de l\'ajout du pronostic' });
        }
        res.status(201).json({ success: true, id: result.insertId });
    });
});

// Route pour mettre à jour un pronostic
router.put('/predictions/:id', (req, res) => {
    const { id } = req.params;
    const { prediction } = req.body;
    const query = 'UPDATE UserPredictions SET prediction = ? WHERE id = ?';
    connection.query(query, [prediction, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du pronostic' });
        }
        res.json({ success: true });
    });
});

// Route pour supprimer un pronostic
router.delete('/predictions/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM UserPredictions WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la suppression du pronostic' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
