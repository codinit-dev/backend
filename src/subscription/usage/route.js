const express = require('express');
const router = express.Router();
const { createServerClient } = require('../../lib/supabase-server');
const { stripe } = require('../../lib/stripe');

router.get('/', async (req, res) => {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { data: teamData } = await supabase
    .from('users_teams')
    .select('teams (stripe_customer_id)')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single();

  const customerId = (teamData?.teams)?.stripe_customer_id;

  if (!customerId) {
    return res.json({ usage: [] });
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items'],
    });

    if (!subscriptions.data.length) {
      return res.json({ usage: [] });
    }

    const subscription = subscriptions.data[0];
    const usage = subscription.items.data.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: {
        id: (item.price).id,
        unit_amount: (item.price).unit_amount,
        currency: (item.price).currency,
        product: (item.price).product,
      },
    }));

    return res.json({ usage });
  } catch (error) {
    console.error('Error fetching Stripe subscription usage:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription usage' });
  }
});

module.exports = router;
