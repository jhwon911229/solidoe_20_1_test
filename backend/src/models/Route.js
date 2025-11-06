const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trip_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trips',
      key: 'id'
    }
  },
  origin: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '{ address, lat, lng, name }'
  },
  destination: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '{ address, lat, lng, name }'
  },
  waypoints: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of intermediate stops'
  },
  transportation_mode: {
    type: DataTypes.ENUM('walking', 'driving', 'bus', 'train', 'flight', 'mixed'),
    allowNull: false
  },
  distance_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  route_details: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Detailed route information from Google Maps'
  },
  departure_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  arrival_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'routes'
});

module.exports = Route;
