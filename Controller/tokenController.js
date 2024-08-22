const getTotalBalance = (firebaseUid, connection) => {
    return new Promise((resolve, reject) => {
      // Première requête pour obtenir l'ID utilisateur à partir du uid Firebase
      const userIdQuery = 'SELECT id FROM Users WHERE uid = ?';
  
      connection.query(userIdQuery, [firebaseUid], (err, results) => {
        if (err) {
          console.error('Erreur lors de la récupération de l\'ID utilisateur:', err);
          return reject(err);
        }
  
        if (results.length === 0) {
          console.log('Aucun utilisateur trouvé pour ce uid:', firebaseUid);
          return resolve(0);
        }
  
        const userId = results[0].id;
  
        // Deuxième requête pour obtenir le totalBalance à partir de l'id utilisateur
        const balanceQuery = 'SELECT COALESCE(SUM(balance), 0) AS totalBalance FROM Tokens WHERE user_id = ?';
  
        connection.query(balanceQuery, [userId], (err, results) => {
          if (err) {
            console.error('Erreur lors de la récupération du solde:', err);
            return reject(err);
          }
          console.log('Résultats de la requête balance:', results);
          resolve((results[0].totalBalance || 0) / 100);
        });
      });
    });
  };
  
  module.exports = { getTotalBalance };
  