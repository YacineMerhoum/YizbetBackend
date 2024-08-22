const stripe = require('stripe')('sk_test_51PZaC3J7Z5palmd7vGlYPvqoEEQRtm0NHuDwV6C9V1n9HVFtBH0xt4UdwSzTbGZvz9zdTrSpPFiYVPNZMsQJXtit009ARd2eID');
const endpointSecret = 'whsec_0d2deed7e9cb2176361fdb6f166e934391c70f47889d38fb624c7ceac18e62df';
const currentUser = require('../Middlewares/currentUser');

exports.createCheckoutSession = async (req, res, connection) => {
  try {
    const { priceId } = req.body;
    const userId = currentUser.getCurrentUser();
    if (!userId) {
      console.error('User ID not found.');
      return res.status(400).json({ error: 'Utilisateur non connecté' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000?success=true`,
      cancel_url: `http://localhost:3000?canceled=true`,
      metadata: { userId },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.webhookHandler = async (req, res, connection) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata.userId;
        console.log(`Checkout session completed: ${session.id}`);

        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        const amount = paymentIntent.amount;

        // Enregistrer le paiement dans la table Payments
        const paymentQuery = 'INSERT INTO Payments (payment_intent_id, amount, user_id, created_at) VALUES (?, ?, ?, ?)';
        connection.query(paymentQuery, [paymentIntent.id, amount, userId, new Date()], (err, results) => {
          if (err) {
            console.error('Erreur lors de l\'insertion des données de paiement :', err);
          } else {
            console.log('PaymentIntent enregistré avec succès!');
            
            // Vérifier l'existence de l'utilisateur dans la table Tokens
            const checkUserQuery = 'SELECT COUNT(*) AS count FROM Tokens WHERE user_id = ?';
            connection.query(checkUserQuery, [userId], (err, results) => {
              if (err) {
                console.error('Erreur lors de la vérification de l\'utilisateur :', err);
                return;
              }

              const userExists = results[0].count > 0;

              if (userExists) {
                // Si l'utilisateur existe, mettre à jour la balance
                const updateBalanceQuery = 'UPDATE Tokens SET balance = balance + ? WHERE user_id = ?';
                connection.query(updateBalanceQuery, [amount, userId], (err, results) => {
                  if (err) {
                    console.error('Erreur lors de la mise à jour de la balance :', err);
                  } else {
                    console.log('Balance mise à jour avec succès!');
                  }
                });
              } else {
                // Si l'utilisateur n'existe pas, insérer une nouvelle ligne
                const insertBalanceQuery = 'INSERT INTO Tokens (user_id, balance) VALUES (?, ?)';
                connection.query(insertBalanceQuery, [userId, amount], (err, results) => {
                  if (err) {
                    console.error('Erreur lors de l\'insertion de la balance :', err);
                  } else {
                    console.log('Balance insérée avec succès!');
                  }
                });
              }
            });
          }
        });
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`Charge succeeded: ${charge.id}`);
        break;
      case 'charge.updated':
        const chargeUpdate = event.data.object;
          console.log(`Charge succeeded: ${chargeUpdate.id}`);
          break;
      case 'payment_intent.succeeded':
        const paymentIntentObj = event.data.object;
        console.log(`PaymentIntent succeeded: ${paymentIntentObj.id}`);
        break;

      default:
        console.warn(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'événement Stripe :', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors du traitement de l\'événement Stripe' });
    }
  }
};
