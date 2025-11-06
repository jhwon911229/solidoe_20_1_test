const User = require('./User');
const Trip = require('./Trip');
const Route = require('./Route');
const Recommendation = require('./Recommendation');

// Define associations
User.hasMany(Trip, { foreignKey: 'user_id', as: 'trips' });
Trip.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Trip.hasMany(Route, { foreignKey: 'trip_id', as: 'routes' });
Route.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

Trip.hasMany(Recommendation, { foreignKey: 'trip_id', as: 'recommendations' });
Recommendation.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

module.exports = {
  User,
  Trip,
  Route,
  Recommendation
};
