const { Trip, Route, Recommendation } = require('../models');

/**
 * Analyze trip cost and budget utilization
 * @param {String} tripId - Trip ID
 * @returns {Object} Cost analysis
 */
const analyzeTripCostService = async (tripId) => {
  try {
    const trip = await Trip.findByPk(tripId, {
      include: ['routes', 'recommendations']
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Calculate total distance and duration from routes
    let totalDistance = 0;
    let totalDuration = 0;
    let totalTransportCost = 0;
    const transportationBreakdown = {};

    for (const route of trip.routes) {
      totalDistance += parseFloat(route.distance_km) || 0;
      totalDuration += route.duration_minutes || 0;
      totalTransportCost += parseFloat(route.estimated_cost) || 0;

      const mode = route.transportation_mode;
      if (!transportationBreakdown[mode]) {
        transportationBreakdown[mode] = {
          mode,
          distance_km: 0,
          duration_minutes: 0,
          cost: 0
        };
      }

      transportationBreakdown[mode].distance_km += parseFloat(route.distance_km) || 0;
      transportationBreakdown[mode].duration_minutes += route.duration_minutes || 0;
      transportationBreakdown[mode].cost += parseFloat(route.estimated_cost) || 0;
    }

    // Calculate total cost from recommendations
    let totalRecommendationCost = 0;
    for (const rec of trip.recommendations) {
      totalRecommendationCost += parseFloat(rec.estimated_cost) || 0;
    }

    const totalEstimatedCost = totalTransportCost + totalRecommendationCost;

    // Calculate trip duration in days
    const tripDays = Math.ceil(
      (new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)
    ) || 1;

    const dailyBudget = parseFloat(trip.budget) / tripDays;
    const budgetUtilization = (totalEstimatedCost / parseFloat(trip.budget)) * 100;

    return {
      total_distance_km: totalDistance.toFixed(2),
      total_duration_minutes: totalDuration,
      total_estimated_cost: totalEstimatedCost.toFixed(2),
      transportation_breakdown: Object.values(transportationBreakdown).map(tb => ({
        ...tb,
        distance_km: tb.distance_km.toFixed(2),
        cost: tb.cost.toFixed(2)
      })),
      daily_budget: dailyBudget.toFixed(2),
      budget_utilization: budgetUtilization.toFixed(2)
    };
  } catch (error) {
    console.error('Budget analysis error:', error);
    throw new Error('Failed to analyze trip cost');
  }
};

/**
 * Optimize trip budget by adjusting recommendations
 * @param {String} tripId - Trip ID
 * @param {Number} targetBudget - Target budget
 * @returns {Array} Optimized recommendations
 */
const optimizeTripBudget = async (tripId, targetBudget) => {
  try {
    const trip = await Trip.findByPk(tripId, {
      include: ['routes', 'recommendations']
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Calculate fixed costs (transportation)
    let fixedCost = 0;
    for (const route of trip.routes) {
      fixedCost += parseFloat(route.estimated_cost) || 0;
    }

    const availableBudget = targetBudget - fixedCost;

    if (availableBudget <= 0) {
      throw new Error('Budget too low to cover transportation costs');
    }

    // Sort recommendations by value (score / cost ratio)
    const recommendations = trip.recommendations
      .map(rec => ({
        ...rec.toJSON(),
        value_ratio: rec.recommendation_score / (parseFloat(rec.estimated_cost) || 1)
      }))
      .sort((a, b) => b.value_ratio - a.value_ratio);

    // Greedy knapsack approach to select recommendations
    const optimized = [];
    let currentCost = 0;

    for (const rec of recommendations) {
      const recCost = parseFloat(rec.estimated_cost) || 0;
      if (currentCost + recCost <= availableBudget) {
        optimized.push(rec);
        currentCost += recCost;
      }
    }

    return optimized;
  } catch (error) {
    console.error('Budget optimization error:', error);
    throw new Error('Failed to optimize budget');
  }
};

/**
 * Generate budget breakdown by category
 * @param {String} tripId - Trip ID
 * @returns {Object} Budget breakdown
 */
const getBudgetBreakdown = async (tripId) => {
  try {
    const trip = await Trip.findByPk(tripId, {
      include: ['routes', 'recommendations']
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const breakdown = {
      transportation: 0,
      restaurant: 0,
      attraction: 0,
      accommodation: 0,
      activity: 0
    };

    // Transportation costs
    for (const route of trip.routes) {
      breakdown.transportation += parseFloat(route.estimated_cost) || 0;
    }

    // Recommendation costs by type
    for (const rec of trip.recommendations) {
      const cost = parseFloat(rec.estimated_cost) || 0;
      breakdown[rec.type] += cost;
    }

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return {
      breakdown,
      total,
      percentages: Object.keys(breakdown).reduce((acc, key) => {
        acc[key] = total > 0 ? ((breakdown[key] / total) * 100).toFixed(2) : 0;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Budget breakdown error:', error);
    throw new Error('Failed to get budget breakdown');
  }
};

module.exports = {
  analyzeTripCostService,
  optimizeTripBudget,
  getBudgetBreakdown
};
