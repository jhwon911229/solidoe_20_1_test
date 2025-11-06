const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
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
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  budget_currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'KRW'
  },
  travelers_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('planning', 'confirmed', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  itinerary: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of daily plans'
  },
  transportation_preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      modes: ['bus', 'train', 'flight'],
      priority: 'balanced' // balanced, fastest, cheapest
    }
  }
}, {
  timestamps: true,
  tableName: 'trips'
});

module.exports = Trip;
