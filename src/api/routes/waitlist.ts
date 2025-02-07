import express from 'express';
import { WaitlistQueries } from '../../db/waitlist';

const router = express.Router();

// Debug middleware for waitlist routes
router.use((req, res, next) => {
  console.log('[Waitlist] Handling request:', req.method, req.baseUrl + req.url);
  next();
});

// Check if email exists
router.post('/check', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await WaitlistQueries.checkEmail(email);
    return res.json(result);  
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Join waitlist or update choices
router.post('/join', async (req, res) => {
  try {
    const { email, useCases, customUseCase } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email exists
    const { exists } = await WaitlistQueries.checkEmail(email);
    
    // Create new entry
    const entry = await WaitlistQueries.addEntry({
      email,
      status: exists ? 'update' : 'join',
      use_cases: useCases || [],
      custom_case: customUseCase
    });

    return res.json({ 
      success: true, 
      updated: exists,
      entry
    });
  } catch (error) {
    console.error('Error processing waitlist entry:', error);
    
    // Check for our custom error from the trigger
    if (error instanceof Error && error.message.includes('Please wait')) {
      return res.status(429).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
