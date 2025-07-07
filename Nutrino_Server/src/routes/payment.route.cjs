const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: "rzp_test_5mWhr2b2Z5jFgc",
  key_secret:"43Ar8AGzM575mKqbuhIuuxXo",
});


router.post('/create-order', async (req, res) => {
  try {
    const { email, planId } = req.body;

    // Validate input
    if (!email || !planId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    if(!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId =  user.id
    // Get plan details (you might want to store these in your database)
    const plans = {
      '6month': { amount: 11000, description: 'Premium 6 Months' },
      '1year': { amount: 19900, description: 'Premium 1 Year' }
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Check if user already has an active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: parseInt(userId),
        isActive: true,
        endDate: { gt: new Date() }
      }
    });

    if (activeSubscription) {
      return res.status(400).json({ 
        error: 'You already have an active subscription',
        subscription: activeSubscription
      });
    }

    
    const options = {
      amount: plan.amount,
      currency: 'INR',
      receipt: `sub_${userId}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId: userId.toString(),
        planId: planId
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order);
    // Create subscription record in database
    const subscription = await prisma.subscription.create({
      data: {
        userId: parseInt(userId),
        planId: planId,
        razorpayOrderId: order.id,
        amount: plan.amount,
        status: 'pending'
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subscriptionId: subscription.id
    });

  } catch (error) {
    console.error('Error creating subscription order:', error);
    res.status(500).json({ error: 'Failed to create subscription order' });
  }
});

// Verify payment and activate subscription
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('Verifying payment:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }
    
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', "kjwbasjkbjkbkasbkb")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Find the subscription record
    const subscription = await prisma.subscription.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status === 'success') {
      return res.json({ 
        message: 'Subscription already activated',
        subscription: subscription
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    if (subscription.planId === '6month') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (subscription.planId === '1year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update subscription record
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'success',
        isActive: true,
        startDate: startDate,
        endDate: endDate
      }
    });
   console.log(updatedSubscription)
    // Here you might want to:
    // 1. Send a confirmation email
    // 2. Update user's premium status in your system
    // 3. Trigger any onboarding flows for new premium users

    res.json({
      message: 'Subscription activated successfully',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    res.status(500).json({ error: 'Failed to verify subscription payment' });
  }
});

// Get user's active subscription
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
     console.log('Fetching subscription for email:', email);
     const user = await prisma.user.findUnique({
      where:{
        email
      }
     })
     if(!user) {
      return res.status(404).json({ error: 'User not found' });
     }
    const userId = user.id;

    // Find active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        isActive: true,
        endDate: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'No active subscription found',
        hasActiveSubscription: false
      });
    }

    res.json({
      hasActiveSubscription: true,
      subscription: subscription
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch user subscription' });
  }
});

// Add this endpoint to your existing subscription routes
router.post('/status', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find active subscription for this email
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        user: { email }, // Assuming your User model has an email field
        isActive: true,
        endDate: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        planId: true,
        startDate: true,
        endDate: true
      }
    });

    res.json({
      isActive: !!activeSubscription,
      subscription: activeSubscription || null
    });

  } catch (error) {
    console.error('Subscription status check error:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Webhook for payment events (optional but recommended)
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);
    
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (generatedSignature !== webhookSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload.payment || req.body.payload.order;

    if (!payload) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Handle different payment events
    switch (event) {
      case 'payment.captured':
        // Payment was successful
        await handleSuccessfulPayment(payload);
        break;
      
      case 'payment.failed':
        // Payment failed
        await handleFailedPayment(payload);
        break;
      
      case 'order.paid':
        // Order was paid (alternative to payment.captured)
        await handleSuccessfulPayment(payload);
        break;
      
      default:
        // Ignore other events
        break;
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

async function handleSuccessfulPayment(payment) {
  try {
    // Find the subscription by order ID
    const subscription = await prisma.subscription.findUnique({
      where: { razorpayOrderId: payment.order_id }
    });

    if (!subscription) {
      console.error('Subscription not found for order:', payment.order_id);
      return;
    }

    if (subscription.status === 'success') {
      return; // Already processed
    }

    // Calculate subscription dates
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    if (subscription.planId === '6month') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (subscription.planId === '1year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        razorpayPaymentId: payment.id,
        status: 'success',
        isActive: true,
        startDate: startDate,
        endDate: endDate
      }
    });

    // Here you can:
    // 1. Send confirmation email
    // 2. Update user's premium status
    // 3. Trigger any onboarding flows

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(payment) {
  try {
    // Find the subscription by order ID
    const subscription = await prisma.subscription.findUnique({
      where: { razorpayOrderId: payment.order_id }
    });

    if (!subscription) {
      console.error('Subscription not found for order:', payment.order_id);
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'failed',
        isActive: false
      }
    });

    // Here you can notify the user about the failed payment

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

module.exports = router;