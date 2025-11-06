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

// Mock database for trips with DEMO data
let trips = [
  {
    id: 1,
    title: '서울 주말 여행',
    origin: {
      name: '인천국제공항',
      address: '인천광역시 중구 공항로 272',
      lat: 37.4602,
      lng: 126.4407
    },
    destination: {
      name: '명동',
      address: '서울특별시 중구 명동',
      lat: 37.5636,
      lng: 126.9826
    },
    startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    budget: 500000,
    status: 'planning',
    itinerary: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: '부산 바다 여행',
    origin: {
      name: '서울역',
      address: '서울특별시 용산구 한강대로 405',
      lat: 37.5547,
      lng: 126.9707
    },
    destination: {
      name: '해운대',
      address: '부산광역시 해운대구 해운대해변로',
      lat: 35.1587,
      lng: 129.1603
    },
    startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    budget: 800000,
    status: 'confirmed',
    itinerary: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 3,
    title: '제주도 힐링 여행',
    origin: {
      name: '김포국제공항',
      address: '서울특별시 강서구 하늘길 38',
      lat: 37.5583,
      lng: 126.7906
    },
    destination: {
      name: '제주 국제공항',
      address: '제주특별자치도 제주시 공항로 2',
      lat: 33.5066,
      lng: 126.4931
    },
    startDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
    budget: 1200000,
    status: 'planning',
    itinerary: [],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];
let tripIdCounter = 4;

// Enhanced Mock database for recommendations with more data
const mockRecommendations = {
  restaurants: [
    { id: 1, name: '명동교자', rating: 4.6, priceLevel: 2, cuisine: '한식', distance: 0.3, description: '50년 전통의 칼국수와 만두 전문점' },
    { id: 2, name: '전주중앙회관', rating: 4.5, priceLevel: 2, cuisine: '한식', distance: 0.5, description: '정통 전주비빔밥의 명가' },
    { id: 3, name: '토스카나', rating: 4.4, priceLevel: 3, cuisine: '이탈리안', distance: 1.2, description: '정통 이탈리아 요리와 와인' },
    { id: 4, name: '스시 초밥', rating: 4.7, priceLevel: 4, cuisine: '일식', distance: 0.8, description: '신선한 해산물과 장인 정신' },
    { id: 5, name: '미스터 피자', rating: 4.2, priceLevel: 2, cuisine: '양식', distance: 0.6, description: '가족 단위 방문객에게 인기' },
    { id: 6, name: '광화문 국밥', rating: 4.5, priceLevel: 1, cuisine: '한식', distance: 1.5, description: '진한 육수의 소고기 국밥' },
  ],
  attractions: [
    { id: 1, name: '경복궁', rating: 4.8, priceLevel: 1, category: '문화/역사', distance: 2.1, description: '조선시대 대표 궁궐, 유네스코 세계문화유산' },
    { id: 2, name: 'N서울타워', rating: 4.6, priceLevel: 2, category: '관광', distance: 1.5, description: '서울 전경을 한눈에, 야경 명소' },
    { id: 3, name: '북촌 한옥마을', rating: 4.7, priceLevel: 0, category: '문화', distance: 1.8, description: '전통 한옥과 현대가 조화된 거리' },
    { id: 4, name: '국립중앙박물관', rating: 4.7, priceLevel: 0, category: '문화', distance: 3.2, description: '한국 역사와 문화의 보고' },
    { id: 5, name: '한강공원', rating: 4.5, priceLevel: 0, category: '자연', distance: 2.5, description: '자전거, 피크닉, 수상 스포츠' },
    { id: 6, name: '코엑스 아쿠아리움', rating: 4.4, priceLevel: 2, category: '체험', distance: 4.0, description: '도심 속 수중 세계 탐험' },
    { id: 7, name: '롯데월드', rating: 4.5, priceLevel: 3, category: '테마파크', distance: 3.8, description: '실내외 테마파크와 쇼핑' },
    { id: 8, name: '인사동', rating: 4.6, priceLevel: 1, category: '문화/쇼핑', distance: 1.2, description: '전통 문화거리와 갤러리' },
  ],
  hotels: [
    { id: 1, name: '롯데호텔 서울', rating: 4.7, priceLevel: 4, stars: 5, distance: 1.0, description: '명동 중심, 최고급 시설과 서비스' },
    { id: 2, name: '신라호텔', rating: 4.8, priceLevel: 5, stars: 5, distance: 2.3, description: '한국 최고급 호텔, 전통과 현대의 조화' },
    { id: 3, name: '메리어트 호텔', rating: 4.5, priceLevel: 4, stars: 5, distance: 1.5, description: '국제적 수준의 비즈니스 호텔' },
    { id: 4, name: '이비스 앰배서더', rating: 4.3, priceLevel: 3, stars: 4, distance: 0.6, description: '합리적 가격의 비즈니스 호텔' },
    { id: 5, name: '소울 게스트하우스', rating: 4.5, priceLevel: 2, stars: 3, distance: 1.8, description: '친근한 분위기의 게스트하우스' },
    { id: 6, name: '호스텔 코리아', rating: 4.4, priceLevel: 1, stars: 2, distance: 1.3, description: '배낭여행자를 위한 경제적 숙소' },
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
