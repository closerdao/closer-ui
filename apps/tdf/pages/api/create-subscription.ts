import { NextApiHandler } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2022-11-15',
});

const handler: NextApiHandler = async (req, res) => {
  const email = req.body.email;
  const payment_method = req.body.paymentMethod;
  const priceId = req.body.priceId;

  const existingCustomers = await stripe.customers.list({
    email,
  });
  let customer;
  let id;
  if (existingCustomers.data.length != 0) {
    customer = await stripe.customers.retrieve(existingCustomers.data[0].id);
    id = existingCustomers.data[0].id;
  } else {
    customer = await stripe.customers.create({
      email,
      payment_method,
    });
    id = customer.id;
  }

  //needed use the customer payment info for future charges
  await stripe.setupIntents.create({
    customer: id,
    payment_method: payment_method,
    payment_method_types: ['card'],
  });

  //attach payment method to customer for future charges
  await stripe.paymentMethods.attach(payment_method, { customer: id });

  const subscription = await stripe.subscriptions.create({
    customer: id,
    //needed for recurring charges
    default_payment_method: payment_method,
    items: [{ price: priceId }],
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const intent = invoice.payment_intent as Stripe.PaymentIntent;

  res
    .status(200)
    .json({
      results: {
        status: subscription.status,
        subscription: subscription.id,
        clientSecret: intent.client_secret,
      },
    });
};

export default handler;
