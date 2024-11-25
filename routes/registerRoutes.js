const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const connection = require('../db')

// Route d'inscription
router.post('/register', async (req, res) => {
  const { email, pseudo, dob, uid, password, google } = req.body

  if (google) {
    // Inscription via Google
    try {
      const query = 'INSERT INTO users (email, pseudo, uid , dob) VALUES (?, ?, ?, ?)'
      connection.query(query, [email, pseudo, uid , dob], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion des données :', err);
          return res.status(500).json({ error: 'Erreur lors de l\'inscription' })
        }
        res.status(201).json({ message: 'Inscription réussie via Google !', userId: results.insertId })
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription avec Google :', error)
      res.status(500).json({ error: 'Erreur lors de l\'inscription avec Google' })
    }
  } else {
    // Inscription classique avec mot de passe
    try {
      // Hachage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)
      const query = 'INSERT INTO users (email, pseudo, dob, uid, password) VALUES (?, ?, ?, ?, ?)'

      connection.query(query, [email, pseudo, dob, uid, hashedPassword], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion des données :', err);
          return res.status(500).json({ error: 'Erreur lors de l\'inscription' })
        }
        res.status(201).json({ message: 'Inscription réussie !', userId: results.insertId })
      });
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe :', error)
      res.status(500).json({ error: 'Erreur lors de l\'inscription' })
    }
  }
})

module.exports = router
