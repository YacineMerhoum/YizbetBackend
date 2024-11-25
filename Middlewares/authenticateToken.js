const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.status(401).json({ error: 'Token manquant' })

  jwt.verify(token, 'SECRET_KEY', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' })

    req.userId = user.id
    next()
  })
}

module.exports = authenticateToken
