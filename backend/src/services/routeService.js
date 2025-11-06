const axios = require('axios');
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Calculate route between two locations using Google Maps API
 * @param {Object} origin - Origin location { address, lat, lng }
 * @param {Object} destination - Destination location { address, lat, lng }
 * @param {String} mode - Transportation mode (driving, walking, transit, bicycling)
 * @returns {Object} Route data
 */
const calculateRouteService = async (origin, destination, mode) => {
  try {
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json`;
    const params = {
      origin: originStr,
      destination: destinationStr,
      mode: mode === 'driving' ? 'driving' : mode === 'walking' ? 'walking' : 'transit',
      key: GOOGLE_MAPS_API_KEY,
      alternatives: true
    };

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      origin,
      destination,
      waypoints: [],
      transportation_mode: mode,
      distance_km: (leg.distance.value / 1000).toFixed(2),
      duration_minutes: Math.ceil(leg.duration.value / 60),
      estimated_cost: estimateCost(mode, leg.distance.value / 1000),
      route_details: {
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance_meters: step.distance.value,
          duration_seconds: step.duration.value,
          mode: step.travel_mode
        })),
        polyline: route.overview_polyline.points
      }
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    throw new Error('Failed to calculate route');
  }
};

/**
 * Estimate cost based on transportation mode and distance
 * @param {String} mode - Transportation mode
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {Number} Estimated cost in KRW
 */
const estimateCost = (mode, distanceKm) => {
  const costs = {
    walking: 0,
    driving: distanceKm * 150, // 150 KRW per km (fuel + tolls)
    bus: Math.max(1200, distanceKm * 50),
    train: Math.max(1400, distanceKm * 80),
    flight: distanceKm > 300 ? distanceKm * 200 : 0
  };

  return costs[mode] || 0;
};

/**
 * Get real-time transportation options
 * @param {Object} origin - Origin location
 * @param {Object} destination - Destination location
 * @returns {Array} Transportation options
 */
const getTransportationOptions = async (origin, destination) => {
  const modes = ['driving', 'walking', 'bus', 'train'];
  const options = [];

  for (const mode of modes) {
    try {
      const route = await calculateRouteService(origin, destination, mode);
      options.push({
        mode,
        ...route
      });
    } catch (error) {
      console.error(`Failed to get ${mode} option:`, error.message);
    }
  }

  return options.sort((a, b) => a.duration_minutes - b.duration_minutes);
};

module.exports = {
  calculateRouteService,
  getTransportationOptions
};
