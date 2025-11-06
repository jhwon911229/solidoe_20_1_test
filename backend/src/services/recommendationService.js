const axios = require('axios');
const { Recommendation } = require('../models');
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';

/**
 * Generate personalized recommendations for a trip
 * @param {Object} trip - Trip object
 * @returns {Array} Recommendations
 */
const generateRecommendationsService = async (trip) => {
  try {
    // Get recommendations from Python recommendation engine
    const pythonRecommendations = await getPythonRecommendations(trip);

    // Get nearby places from Google Maps
    const googlePlaces = await getNearbyPlaces(trip.destination);

    // Combine and score recommendations
    const recommendations = await combineRecommendations(
      trip,
      pythonRecommendations,
      googlePlaces
    );

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map(rec =>
        Recommendation.create({
          trip_id: trip.id,
          ...rec
        })
      )
    );

    return savedRecommendations;
  } catch (error) {
    console.error('Recommendation generation error:', error);
    throw new Error('Failed to generate recommendations');
  }
};

/**
 * Get recommendations from Python recommendation engine
 * @param {Object} trip - Trip object
 * @returns {Array} Python-generated recommendations
 */
const getPythonRecommendations = async (trip) => {
  try {
    const response = await axios.post(`${RECOMMENDATION_SERVICE_URL}/recommend`, {
      destination: trip.destination,
      budget: trip.budget,
      duration_days: Math.ceil(
        (new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)
      ),
      preferences: trip.user?.preferences || {},
      transportation_preferences: trip.transportation_preferences
    });

    return response.data.recommendations || [];
  } catch (error) {
    console.error('Python recommendation service error:', error.message);
    return [];
  }
};

/**
 * Get nearby places from Google Maps Places API
 * @param {Object} location - Location object { lat, lng }
 * @returns {Array} Nearby places
 */
const getNearbyPlaces = async (location) => {
  try {
    const types = ['restaurant', 'tourist_attraction', 'lodging', 'museum', 'park'];
    const places = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
      const params = {
        location: `${location.lat},${location.lng}`,
        radius: 5000, // 5km radius
        type,
        key: GOOGLE_MAPS_API_KEY
      };

      const response = await axios.get(url, { params });

      if (response.data.status === 'OK') {
        places.push(...response.data.results.slice(0, 10));
      }
    }

    return places;
  } catch (error) {
    console.error('Google Places API error:', error.message);
    return [];
  }
};

/**
 * Combine and score recommendations from multiple sources
 * @param {Object} trip - Trip object
 * @param {Array} pythonRecs - Python recommendations
 * @param {Array} googlePlaces - Google places
 * @returns {Array} Combined recommendations
 */
const combineRecommendations = async (trip, pythonRecs, googlePlaces) => {
  const recommendations = [];

  // Process Google Places
  for (const place of googlePlaces) {
    const type = mapGoogleTypeToRecommendationType(place.types);
    if (!type) continue;

    recommendations.push({
      type,
      name: place.name,
      description: place.vicinity,
      location: {
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || 0,
      price_range: mapPriceLevel(place.price_level),
      estimated_cost: estimatePlaceCost(type, place.price_level),
      estimated_duration_minutes: estimateDuration(type),
      recommendation_score: calculateScore(place, trip),
      tags: place.types || [],
      images: place.photos ? place.photos.map(p => p.photo_reference) : [],
      external_links: {
        reviews: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      }
    });
  }

  // Add Python recommendations
  for (const rec of pythonRecs) {
    recommendations.push({
      ...rec,
      recommendation_score: rec.score || 0.5
    });
  }

  // Sort by recommendation score
  return recommendations
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, 50); // Top 50 recommendations
};

/**
 * Map Google place types to recommendation types
 */
const mapGoogleTypeToRecommendationType = (types) => {
  if (types.includes('restaurant') || types.includes('cafe')) return 'restaurant';
  if (types.includes('tourist_attraction') || types.includes('museum') || types.includes('park')) return 'attraction';
  if (types.includes('lodging')) return 'accommodation';
  return 'activity';
};

/**
 * Map Google price level to our price range
 */
const mapPriceLevel = (priceLevel) => {
  if (priceLevel === undefined) return 'moderate';
  if (priceLevel <= 1) return 'budget';
  if (priceLevel === 2) return 'moderate';
  if (priceLevel === 3) return 'expensive';
  return 'luxury';
};

/**
 * Estimate cost based on type and price level
 */
const estimatePlaceCost = (type, priceLevel = 2) => {
  const baseCosts = {
    restaurant: [10000, 25000, 50000, 100000],
    attraction: [5000, 15000, 30000, 50000],
    accommodation: [50000, 100000, 200000, 400000],
    activity: [20000, 40000, 80000, 150000]
  };

  return baseCosts[type]?.[priceLevel] || 30000;
};

/**
 * Estimate duration based on type
 */
const estimateDuration = (type) => {
  const durations = {
    restaurant: 90,
    attraction: 120,
    accommodation: 0,
    activity: 180
  };

  return durations[type] || 60;
};

/**
 * Calculate recommendation score
 */
const calculateScore = (place, trip) => {
  let score = 0.5;

  // Rating factor
  if (place.rating) {
    score += (place.rating / 5) * 0.3;
  }

  // Price factor (match with budget)
  const budgetPerDay = trip.budget / Math.ceil(
    (new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)
  );

  if (place.price_level !== undefined) {
    const priceScore = 1 - Math.abs(place.price_level - 2) / 3;
    score += priceScore * 0.2;
  }

  return Math.min(Math.max(score, 0), 1);
};

module.exports = {
  generateRecommendationsService,
  getNearbyPlaces
};
