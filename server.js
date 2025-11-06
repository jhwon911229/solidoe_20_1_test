const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock database for trips
let trips = [];
let tripIdCounter = 1;

// Mock database for recommendations
const mockRecommendations = {
  restaurants: [
    { id: 1, name: '맛있는 식당', rating: 4.5, priceLevel: 2, cuisine: '한식', distance: 0.5 },
    { id: 2, name: '글로벌 레스토랑', rating: 4.3, priceLevel: 3, cuisine: '양식', distance: 1.2 },
    { id: 3, name: '전통 맛집', rating: 4.7, priceLevel: 2, cuisine: '중식', distance: 0.8 },
  ],
  attractions: [
    { id: 1, name: '역사 박물관', rating: 4.6, priceLevel: 1, category: '문화', distance: 2.1 },
    { id: 2, name: '시티 타워', rating: 4.4, priceLevel: 2, category: '관광', distance: 1.5 },
    { id: 3, name: '공원', rating: 4.8, priceLevel: 0, category: '자연', distance: 0.7 },
  ],
  hotels: [
    { id: 1, name: '럭셔리 호텔', rating: 4.7, priceLevel: 4, stars: 5, distance: 1.0 },
    { id: 2, name: '비즈니스 호텔', rating: 4.3, priceLevel: 3, stars: 4, distance: 0.6 },
    { id: 3, name: '게스트하우스', rating: 4.5, priceLevel: 2, stars: 3, distance: 1.8 },
  ]
};

// API Routes

// Get API configuration
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TripSync Travel Planner API'
  });
});

// Get all trips
app.get('/api/trips', (req, res) => {
  res.json(trips);
});

// Get single trip
app.get('/api/trips/:id', (req, res) => {
  const trip = trips.find(t => t.id === parseInt(req.params.id));
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  res.json(trip);
});

// Create new trip
app.post('/api/trips', (req, res) => {
  const { title, origin, destination, startDate, endDate, budget } = req.body;

  if (!title || !origin || !destination || !startDate || !endDate || !budget) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newTrip = {
    id: tripIdCounter++,
    title,
    origin,
    destination,
    startDate,
    endDate,
    budget: parseFloat(budget),
    status: 'planning',
    itinerary: [],
    createdAt: new Date().toISOString()
  };

  trips.push(newTrip);
  res.status(201).json(newTrip);
});

// Update trip
app.put('/api/trips/:id', (req, res) => {
  const tripIndex = trips.findIndex(t => t.id === parseInt(req.params.id));
  if (tripIndex === -1) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  trips[tripIndex] = {
    ...trips[tripIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(trips[tripIndex]);
});

// Delete trip
app.delete('/api/trips/:id', (req, res) => {
  const tripIndex = trips.findIndex(t => t.id === parseInt(req.params.id));
  if (tripIndex === -1) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  trips.splice(tripIndex, 1);
  res.json({ message: 'Trip deleted successfully' });
});

// Get route information using Google Maps Directions API
app.post('/api/routes/calculate', async (req, res) => {
  const { origin, destination, mode = 'driving' } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      const leg = route.legs[0];

      res.json({
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          mode: step.travel_mode
        })),
        polyline: route.overview_polyline.points
      });
    } else {
      res.status(400).json({ error: 'Could not calculate route' });
    }
  } catch (error) {
    console.error('Route calculation error:', error.message);
    res.status(500).json({ error: 'Failed to calculate route' });
  }
});

// Get recommendations
app.get('/api/recommendations', (req, res) => {
  const { type, lat, lng, budget } = req.query;

  let recommendations = [];

  switch (type) {
    case 'restaurants':
      recommendations = mockRecommendations.restaurants;
      break;
    case 'attractions':
      recommendations = mockRecommendations.attractions;
      break;
    case 'hotels':
      recommendations = mockRecommendations.hotels;
      break;
    default:
      recommendations = [
        ...mockRecommendations.restaurants.slice(0, 2),
        ...mockRecommendations.attractions.slice(0, 2),
        ...mockRecommendations.hotels.slice(0, 1)
      ];
  }

  // Filter by budget if provided
  if (budget) {
    const maxPrice = parseInt(budget);
    recommendations = recommendations.filter(r => r.priceLevel <= maxPrice);
  }

  res.json(recommendations);
});

// Search places using Google Maps Places API
app.get('/api/places/search', async (req, res) => {
  const { query, location } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: query,
        location: location,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK') {
      const places = response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating,
        types: place.types
      }));

      res.json(places);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Places search error:', error.message);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

// Get place details
app.get('/api/places/:placeId', async (req, res) => {
  const { placeId } = req.params;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK') {
      res.json(response.data.result);
    } else {
      res.status(404).json({ error: 'Place not found' });
    }
  } catch (error) {
    console.error('Place details error:', error.message);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TripSync Server is running on http://localhost:${PORT}`);
  console.log(`📍 Google Maps API Key: ${GOOGLE_MAPS_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
