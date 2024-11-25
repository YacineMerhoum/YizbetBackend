const express = require('express')
const router = express.Router()
const connection = require('../db')
const { getTotalBalance } = require('../Controller/tokenController')

// Route pour obtenir le total des balances de l'utilisateur
router.get('/total-balance/:userId', async (req, res) => {
  try {
    const firebaseUid = req.params.userId
    console.log('User ID dans la route:', firebaseUid)

 
    const totalBalance = await getTotalBalance(firebaseUid, connection)
    console.log('Total Balance:', totalBalance)


    res.json({ totalBalance })
  } catch (error) {
    console.error('Error fetching total balance:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
