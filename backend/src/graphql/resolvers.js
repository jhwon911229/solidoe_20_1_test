const jwt = require('jsonwebtoken');
const { User, Trip, Route, Recommendation } = require('../models');
const {
  calculateRouteService,
  generateRecommendationsService,
  analyzeTripCostService
} = require('../services');

const resolvers = {
  // Queries
  me: async ({ }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }
    return await User.findByPk(context.user.id);
  },

  user: async ({ id }) => {
    return await User.findByPk(id);
  },

  trip: async ({ id }) => {
    return await Trip.findByPk(id, {
      include: ['routes', 'recommendations']
    });
  },

  trips: async ({ user_id }) => {
    return await Trip.findAll({
      where: { user_id },
      include: ['routes', 'recommendations'],
      order: [['createdAt', 'DESC']]
    });
  },

  route: async ({ id }) => {
    return await Route.findByPk(id);
  },

  routes: async ({ trip_id }) => {
    return await Route.findAll({
      where: { trip_id },
      order: [['departure_time', 'ASC']]
    });
  },

  calculateRoute: async ({ origin, destination, mode }) => {
    return await calculateRouteService(origin, destination, mode);
  },

  recommendation: async ({ id }) => {
    return await Recommendation.findByPk(id);
  },

  recommendations: async ({ trip_id }) => {
    return await Recommendation.findAll({
      where: { trip_id },
      order: [['recommendation_score', 'DESC']]
    });
  },

  getRecommendations: async ({ trip_id, type }) => {
    const where = { trip_id };
    if (type) {
      where.type = type;
    }
    return await Recommendation.findAll({
      where,
      order: [['recommendation_score', 'DESC']]
    });
  },

  analyzeTripCost: async ({ trip_id }) => {
    return await analyzeTripCostService(trip_id);
  },

  // Mutations
  register: async ({ email, password, name }) => {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await User.create({ email, password, name });
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return { token, user };
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return { token, user };
  },

  updateUserPreferences: async ({ preferences }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const user = await User.findByPk(context.user.id);
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    return user;
  },

  createTrip: async ({ input }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const trip = await Trip.create({
      ...input,
      user_id: context.user.id
    });

    return trip;
  },

  updateTrip: async ({ id, input }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const trip = await Trip.findByPk(id);
    if (!trip || trip.user_id !== context.user.id) {
      throw new Error('Trip not found or unauthorized');
    }

    await trip.update(input);
    return trip;
  },

  deleteTrip: async ({ id }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const trip = await Trip.findByPk(id);
    if (!trip || trip.user_id !== context.user.id) {
      throw new Error('Trip not found or unauthorized');
    }

    await trip.destroy();
    return true;
  },

  addRouteToTrip: async ({ trip_id, origin, destination, mode }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const trip = await Trip.findByPk(trip_id);
    if (!trip || trip.user_id !== context.user.id) {
      throw new Error('Trip not found or unauthorized');
    }

    const routeData = await calculateRouteService(origin, destination, mode);
    const route = await Route.create({
      trip_id,
      ...routeData
    });

    return route;
  },

  generateRecommendations: async ({ trip_id }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const trip = await Trip.findByPk(trip_id);
    if (!trip || trip.user_id !== context.user.id) {
      throw new Error('Trip not found or unauthorized');
    }

    const recommendations = await generateRecommendationsService(trip);
    return recommendations;
  },

  saveRecommendation: async ({ trip_id, recommendation_id }, context) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const trip = await Trip.findByPk(trip_id);
    if (!trip || trip.user_id !== context.user.id) {
      throw new Error('Trip not found or unauthorized');
    }

    // Logic to save recommendation to trip itinerary
    return true;
  }
};

module.exports = resolvers;
