const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');
require('dotenv').config();

const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { sequelize, testConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TripSync Backend',
    timestamp: new Date().toISOString()
  });
});

// GraphQL endpoint
app.use('/graphql', graphqlHTTP(async (req) => {
  const context = await authMiddleware(req);

  return {
    schema,
    rootValue: resolvers,
    context,
    graphiql: process.env.NODE_ENV === 'development'
  };
}));

// REST API endpoints (for additional functionality)
app.get('/api/transportation-options', async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination required' });
    }

    const { getTransportationOptions } = require('./services');
    const options = await getTransportationOptions(
      JSON.parse(origin),
      JSON.parse(destination)
    );

    res.json({ options });
  } catch (error) {
    console.error('Transportation options error:', error);
    res.status(500).json({ error: 'Failed to get transportation options' });
  }
});

app.get('/api/nearby-places', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const { getNearbyPlaces } = require('./services');
    const places = await getNearbyPlaces({ lat: parseFloat(lat), lng: parseFloat(lng) });

    res.json({ places });
  } catch (error) {
    console.error('Nearby places error:', error);
    res.status(500).json({ error: 'Failed to get nearby places' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ Database models synchronized');

    // Connect to Redis
    await connectRedis();

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ TripSync Backend running on port ${PORT}`);
      console.log(`✓ GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
