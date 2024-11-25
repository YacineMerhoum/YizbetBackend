const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cron = require('node-cron')
const mysql = require('mysql2')
const axios = require('axios')
const cors = require('cors')
const bcrypt = require('bcrypt')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
const paymentController = require('./Controller/paymentController')
const { getTotalBalance } = require('./Controller/tokenController')
const dashboardRoutes = require('./routes/Dashboard')
const balanceRoutes = require('./routes/balanceRoutes')
const lastPayment = require('./routes/LastPayment')
const deleteRoute = require('./routes/DeleteRoute')

const userRoutes = require('./routes/userRoutes')
const getUserIdRoute = require('./routes/getUserIdRoute')
const userCreditRoutes = require('./routes/userCreditRoutes')
const userBalanceRoutes = require('./routes/userBalanceRoutes')
const totalBalanceRoutes = require('./routes/totalBalanceRoutes')
const deductBalanceRoutes = require('./routes/deductBalanceRoutes')
const userPredictionsRoutes = require('./routes/userPredictionsRoutes')
const registerRoutes = require('./routes/registerRoutes')

const app = express()
const PORT = 3008

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Yizbet'
})

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err)
    return
  }
  console.log('Connecté à la base de données MySQL !')
});

module.exports = connection

// Configurer CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}))

// Configurer express-session
const sessionStore = new MySQLStore({}, connection)
app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 jour
}))

// Configurer express.raw pour le webhook Stripe
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => paymentController.webhookHandler(req, res, connection))

app.use(bodyParser.json())

app.post('/create-checkout-session', (req, res) => paymentController.createCheckoutSession(req, res, connection))

app.use('/api/admin', dashboardRoutes)

app.use('/api', balanceRoutes)

app.use('/api/last-payment', lastPayment)

app.use('/api', deleteRoute)


// ROUTES DES PAYMENTS USER ETC..
app.use(userCreditRoutes)
app.use(userBalanceRoutes)
app.use(userRoutes)
app.use(getUserIdRoute)
app.use(totalBalanceRoutes)
app.use(deductBalanceRoutes)
app.use(userPredictionsRoutes)
app.use(registerRoutes)




app.get('/api/match-odds', (req, res) => {
  const sql = 'SELECT id, prediction FROM match_odds ORDER BY insertion_order LIMIT 6'
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur de la requête SQL:', err)
      res.status(500).send('Erreur serveur')
      return
    }
    res.send(results)
  })
})



const matchesRoute = require('./routes/matchesRoute')
const { log } = require('console')
app.use(matchesRoute, express.json())

app.use('/data', express.static(path.join(__dirname, 'data')))

async function fetchMatchesData() {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches/",
      {
        headers: {
          "X-Auth-Token": "1a93aed1ad8b40d1af324616d76267c1"
        }
      }
    )
    console.log(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données des matches :', error)
  }
}
// cron.schedule('*/10 * * * * *', fetchMatchesData);
cron.schedule('0 * * * *', fetchMatchesData)

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`)
})

