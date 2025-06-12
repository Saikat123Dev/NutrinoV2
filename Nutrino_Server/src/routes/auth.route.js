import express from 'express';
import { Webhook } from 'svix';
import prisma from "../lib/db.js";
const router = express.Router();

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    // Debug logging (remove in production)
    console.log('Webhook received');
    console.log('Content-Type:', req.headers['content-type']);

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // Log the first few characters of the secret for debugging
    console.log('Secret prefix:', webhookSecret.substring(0, 4) + '...');

    // Get the Svix headers
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    // Debug logging (remove in production)
    console.log('Headers:', { svixId, svixTimestamp, svixSignature });

    // Ensure the request body is a Buffer
    const payload = req.body;
    if (!Buffer.isBuffer(payload)) {
      console.error('Request body is not a Buffer');
      return res.status(400).json({ message: 'Invalid request body format' });
    }

    // Convert the payload to a string
    const payloadString = payload.toString('utf8');

    // Debug logging (remove in production)
    console.log('Payload (first 50 chars):', payloadString.substring(0, 50));

    // Create the Svix headers object
    const svixHeaders = {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    };

    // Verify the webhook
    const svix = new Webhook(webhookSecret);

    try {
      const event = svix.verify(payloadString, svixHeaders);
      console.log('Webhook verified successfully');
      console.log('Event type:', event.type);

      // Process the verified event
      if (event.type === 'user.created') {
        // Extract user data
        const { id, email_addresses, first_name, last_name } = event.data;

        if (!email_addresses || !email_addresses.length) {
          console.error('No email addresses found for user');
          return res.status(400).json({ message: 'No email found for user' });
        }

        const primaryEmail = email_addresses[0].email_address;

        // Create user in database
        try {
          await prisma.user.create({
            data: {
              clerkId: id,
              email: primaryEmail,
              name: `${first_name || ''} ${last_name || ''}`.trim() || 'Anonymous'
            }
          });

          console.log('User created successfully in database');
          return res.status(201).json({ message: 'User created successfully' });
        } catch (dbError) {
          console.error('Database error creating user:', dbError);
          return res.status(500).json({
            message: 'Database error creating user',
            error: dbError.message
          });
        }
      }

      return res.status(200).json({ message: 'Webhook received' });

    } catch (verifyError) {
      console.error('Webhook verification failed:', verifyError);
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

export default router;
