const express = require('express');
const https = require('https');
const router = express.Router();

// Configuration
const RAPIDAPI_KEY = 'b3143c608cmsh81ced036080b07bp160430jsne46189455663';
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';

// Helper function to make API requests
const makeAPIRequest = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: RAPIDAPI_HOST,
      port: null,
      path: path,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    };

    const req = https.request(options, function (res) {
      const chunks = [];
      
      res.on('data', function (chunk) {
        chunks.push(chunk);
      });
      
      res.on('end', function () {
        try {
          const body = Buffer.concat(chunks);
          const data = JSON.parse(body.toString());
          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', function (error) {
      reject(error);
    });

    req.end();
  });
};

// GET /exercises - Get all exercises with optional pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const path = `/exercises?limit=${limit}&offset=${offset}`;
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      data: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercises',
      error: error.message
    });
  }
});

// GET /exercises/bodyPart/:bodyPart - Get exercises by body part
router.get('/bodyPart/:bodyPart', async (req, res) => {
  try {
    const { bodyPart } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const path = `/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=${offset}`;
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      bodyPart: bodyPart,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch exercises for body part: ${req.params.bodyPart}`,
      error: error.message
    });
  }
});

// GET /exercises/bodyPart/list - Get list of all body parts
router.get('/bodyPart/list', async (req, res) => {
  try {
    const path = '/exercises/bodyPartList';
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch body parts list',
      error: error.message
    });
  }
});

// GET /exercises/equipment/list - Get list of all equipment
router.get('/equipment/list', async (req, res) => {
  try {
    const path = '/exercises/equipmentList';
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment list',
      error: error.message
    });
  }
});

// GET /exercises/equipment/:type - Get exercises by equipment type
router.get('/equipment/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const path = `/exercises/equipment/${encodeURIComponent(type)}?limit=${limit}&offset=${offset}`;
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      equipment: type,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch exercises for equipment: ${req.params.type}`,
      error: error.message
    });
  }
});

// GET /exercises/target/list - Get list of all target muscles
router.get('/target/list', async (req, res) => {
  try {
    const path = '/exercises/targetList';
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch target muscles list',
      error: error.message
    });
  }
});

// GET /exercises/target/:target - Get exercises by target muscle
router.get('/target/:target', async (req, res) => {
  try {
    const { target } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const path = `/exercises/target/${encodeURIComponent(target)}?limit=${limit}&offset=${offset}`;
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      target: target,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch exercises for target: ${req.params.target}`,
      error: error.message
    });
  }
});

// GET /exercises/name/:name - Get exercise by name
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const path = `/exercises/name/${encodeURIComponent(name)}`;
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch exercise: ${req.params.name}`,
      error: error.message
    });
  }
});

// GET /exercises/:id - Get exercise by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const path = `/exercises/exercise/${id}`;
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch exercise with ID: ${req.params.id}`,
      error: error.message
    });
  }
});

// GET /status - Check API status
router.get('/misc/status', async (req, res) => {
  try {
    const path = '/status';
    const data = await makeAPIRequest(path);
    
    res.json({
      success: true,
      status: 'API is working',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API status check failed',
      error: error.message
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Exercise Router Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in exercise router',
    error: error.message
  });
});

module.exports = router;