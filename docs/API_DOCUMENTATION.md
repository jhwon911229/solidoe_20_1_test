# TripSync API Documentation

## Overview

TripSync provides a comprehensive travel planning API with the following services:
- **Backend API**: GraphQL endpoint for trip management
- **REST API**: Additional endpoints for transportation and places
- **Recommendation Engine**: Python-based AI recommendation service

---

## Backend API (GraphQL)

**Base URL**: `http://localhost:5000/graphql`

### Authentication

All authenticated requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### Mutations

#### Register User

```graphql
mutation {
  register(
    email: "user@example.com"
    password: "password123"
    name: "John Doe"
  ) {
    token
    user {
      id
      email
      name
    }
  }
}
```

#### Login

```graphql
mutation {
  login(
    email: "user@example.com"
    password: "password123"
  ) {
    token
    user {
      id
      email
      name
      preferences {
        interests
        budget_range
        travel_style
      }
    }
  }
}
```

#### Create Trip

```graphql
mutation {
  createTrip(input: {
    title: "Summer Vacation to Busan"
    origin: {
      address: "Seoul, South Korea"
      lat: 37.5665
      lng: 126.9780
      name: "Seoul"
    }
    destination: {
      address: "Busan, South Korea"
      lat: 35.1796
      lng: 129.0756
      name: "Busan"
    }
    start_date: "2024-07-01"
    end_date: "2024-07-07"
    budget: 1000000
    budget_currency: "KRW"
    travelers_count: 2
  }) {
    id
    title
    status
    budget
  }
}
```

#### Generate Recommendations

```graphql
mutation {
  generateRecommendations(trip_id: "trip-uuid") {
    id
    type
    name
    description
    location {
      address
      lat
      lng
    }
    rating
    price_range
    estimated_cost
    recommendation_score
    tags
  }
}
```

### Queries

#### Get User Trips

```graphql
query {
  trips(user_id: "user-uuid") {
    id
    title
    origin {
      address
      name
    }
    destination {
      address
      name
    }
    start_date
    end_date
    budget
    status
  }
}
```

#### Get Trip Details

```graphql
query {
  trip(id: "trip-uuid") {
    id
    title
    origin {
      address
      lat
      lng
      name
    }
    destination {
      address
      lat
      lng
      name
    }
    start_date
    end_date
    budget
    routes {
      id
      transportation_mode
      distance_km
      duration_minutes
      estimated_cost
    }
    recommendations {
      id
      type
      name
      rating
      price_range
      estimated_cost
      recommendation_score
    }
  }
}
```

#### Calculate Route

```graphql
query {
  calculateRoute(
    origin: {
      address: "Seoul"
      lat: 37.5665
      lng: 126.9780
    }
    destination: {
      address: "Busan"
      lat: 35.1796
      lng: 129.0756
    }
    mode: driving
  ) {
    transportation_mode
    distance_km
    duration_minutes
    estimated_cost
    route_details {
      steps {
        instruction
        distance_meters
        duration_seconds
      }
      polyline
    }
  }
}
```

#### Analyze Trip Cost

```graphql
query {
  analyzeTripCost(trip_id: "trip-uuid") {
    total_distance_km
    total_duration_minutes
    total_estimated_cost
    transportation_breakdown {
      mode
      distance_km
      duration_minutes
      cost
    }
    daily_budget
    budget_utilization
  }
}
```

---

## REST API Endpoints

### Get Transportation Options

**Endpoint**: `GET /api/transportation-options`

**Query Parameters**:
- `origin`: JSON encoded origin location `{"address":"Seoul","lat":37.5665,"lng":126.9780}`
- `destination`: JSON encoded destination location

**Response**:
```json
{
  "options": [
    {
      "mode": "driving",
      "distance_km": "325.50",
      "duration_minutes": 240,
      "estimated_cost": 48825,
      "transportation_mode": "driving"
    },
    {
      "mode": "train",
      "distance_km": "325.50",
      "duration_minutes": 150,
      "estimated_cost": 26040,
      "transportation_mode": "train"
    }
  ]
}
```

### Get Nearby Places

**Endpoint**: `GET /api/nearby-places`

**Query Parameters**:
- `lat`: Latitude (number)
- `lng`: Longitude (number)

**Response**:
```json
{
  "places": [
    {
      "name": "Tourist Attraction",
      "vicinity": "123 Main St",
      "types": ["tourist_attraction"],
      "rating": 4.5,
      "price_level": 2
    }
  ]
}
```

---

## Recommendation Engine API

**Base URL**: `http://localhost:8000`

### Get Recommendations

**Endpoint**: `POST /recommend`

**Request Body**:
```json
{
  "destination": {
    "address": "Busan, South Korea",
    "lat": 35.1796,
    "lng": 129.0756,
    "name": "Busan"
  },
  "budget": 1000000,
  "duration_days": 7,
  "preferences": {
    "interests": ["culture", "food", "nature"],
    "budget_range": "medium",
    "travel_style": "balanced"
  },
  "transportation_preferences": {
    "modes": ["bus", "train"],
    "priority": "balanced"
  }
}
```

**Response**:
```json
{
  "recommendations": [
    {
      "type": "restaurant",
      "name": "Traditional Korean BBQ",
      "description": "A restaurant experience",
      "location": {
        "address": "Busan, South Korea",
        "lat": 35.1796,
        "lng": 129.0756,
        "name": "Traditional Korean BBQ"
      },
      "rating": 4.5,
      "price_range": "moderate",
      "estimated_cost": 35000,
      "estimated_duration_minutes": 90,
      "score": 0.8532,
      "tags": ["korean", "bbq", "traditional", "popular"],
      "images": []
    }
  ]
}
```

### Optimize Itinerary

**Endpoint**: `POST /optimize-itinerary`

**Request Body**:
```json
{
  "recommendations": [...],
  "budget": 1000000,
  "duration_days": 7
}
```

**Response**:
```json
{
  "optimized_itinerary": [
    {
      "day": 1,
      "items": [...],
      "total_cost": 142000,
      "total_duration": 480
    }
  ],
  "total_cost": 980000,
  "budget_utilization": 98.0
}
```

---

## Error Handling

All APIs return errors in the following format:

**GraphQL Errors**:
```json
{
  "errors": [
    {
      "message": "Error description",
      "locations": [...],
      "path": [...]
    }
  ]
}
```

**REST API Errors**:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- Backend API: No rate limiting (development)
- Recommendation Engine: No rate limiting (development)

**Production**: Implement rate limiting based on your requirements.

---

## WebSocket Support

WebSocket support for real-time updates is planned for future releases.

---

## SDK & Libraries

### JavaScript/TypeScript

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// GraphQL request
const response = await api.post('/graphql', {
  query: `
    query {
      trips(user_id: "${userId}") {
        id
        title
      }
    }
  `
});
```

### Python

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        'http://localhost:8000/recommend',
        json={
            'destination': {...},
            'budget': 1000000,
            'duration_days': 7
        }
    )
    recommendations = response.json()
```

---

## Support

For API support and questions:
- GitHub Issues: [TripSync Repository]
- Email: support@tripsync.example.com
