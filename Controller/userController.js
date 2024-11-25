
const connection = require('../index')

exports.getUserIdByUid = (req, res) => {
    console.log(req.params);

    const userId = req.params.userId.trim()
    console.log('UID nettoyé:', userId)

    const query = 'SELECT id FROM users WHERE uid = ?'

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération du user :', err)
            res.status(500).json({ error: 'Erreur lors de la récupération du crédit actuel' })
            return
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        res.status(200).json({ id: results[0].id })
    })
}
