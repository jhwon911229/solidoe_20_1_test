const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Recommendation = sequelize.define('Recommendation', {
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
  type: {
    type: DataTypes.ENUM('restaurant', 'attraction', 'accommodation', 'activity'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '{ address, lat, lng }'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  price_range: {
    type: DataTypes.ENUM('budget', 'moderate', 'expensive', 'luxury'),
    allowNull: true
  },
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  estimated_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  recommendation_score: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    comment: 'AI-generated recommendation score 0-1'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  external_links: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: '{ website, booking, reviews }'
  }
}, {
  timestamps: true,
  tableName: 'recommendations'
});

module.exports = Recommendation;
