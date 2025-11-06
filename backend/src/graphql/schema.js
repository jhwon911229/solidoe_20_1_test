const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type User {
    id: ID!
    email: String!
    name: String!
    preferences: UserPreferences
    profile_image: String
    trips: [Trip!]
    createdAt: String!
    updatedAt: String!
  }

  type UserPreferences {
    interests: [String!]
    budget_range: String
    travel_style: String
  }

  type Trip {
    id: ID!
    user_id: ID!
    title: String!
    origin: Location!
    destination: Location!
    start_date: String!
    end_date: String!
    budget: Float!
    budget_currency: String!
    travelers_count: Int!
    status: TripStatus!
    itinerary: [DayPlan!]
    transportation_preferences: TransportationPreferences
    routes: [Route!]
    recommendations: [Recommendation!]
    createdAt: String!
    updatedAt: String!
  }

  type Location {
    address: String!
    lat: Float!
    lng: Float!
    name: String
  }

  enum TripStatus {
    planning
    confirmed
    ongoing
    completed
    cancelled
  }

  type TransportationPreferences {
    modes: [String!]
    priority: String
  }

  type DayPlan {
    day: Int!
    date: String!
    activities: [Activity!]
  }

  type Activity {
    time: String!
    type: String!
    location: Location!
    description: String
    duration_minutes: Int
    cost: Float
  }

  type Route {
    id: ID!
    trip_id: ID!
    origin: Location!
    destination: Location!
    waypoints: [Location!]
    transportation_mode: TransportationMode!
    distance_km: Float
    duration_minutes: Int
    estimated_cost: Float
    route_details: RouteDetails
    departure_time: String
    arrival_time: String
    createdAt: String!
    updatedAt: String!
  }

  enum TransportationMode {
    walking
    driving
    bus
    train
    flight
    mixed
  }

  type RouteDetails {
    steps: [RouteStep!]
    polyline: String
  }

  type RouteStep {
    instruction: String!
    distance_meters: Float!
    duration_seconds: Int!
    mode: String!
  }

  type Recommendation {
    id: ID!
    trip_id: ID!
    type: RecommendationType!
    name: String!
    description: String
    location: Location!
    rating: Float
    price_range: PriceRange
    estimated_cost: Float
    estimated_duration_minutes: Int
    recommendation_score: Float!
    tags: [String!]
    images: [String!]
    external_links: ExternalLinks
    createdAt: String!
    updatedAt: String!
  }

  enum RecommendationType {
    restaurant
    attraction
    accommodation
    activity
  }

  enum PriceRange {
    budget
    moderate
    expensive
    luxury
  }

  type ExternalLinks {
    website: String
    booking: String
    reviews: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type TripAnalysis {
    total_distance_km: Float!
    total_duration_minutes: Int!
    total_estimated_cost: Float!
    transportation_breakdown: [TransportationBreakdown!]
    daily_budget: Float!
    budget_utilization: Float!
  }

  type TransportationBreakdown {
    mode: String!
    distance_km: Float!
    duration_minutes: Int!
    cost: Float!
  }

  input LocationInput {
    address: String!
    lat: Float!
    lng: Float!
    name: String
  }

  input TripInput {
    title: String!
    origin: LocationInput!
    destination: LocationInput!
    start_date: String!
    end_date: String!
    budget: Float!
    budget_currency: String
    travelers_count: Int
    transportation_preferences: TransportationPreferencesInput
  }

  input TransportationPreferencesInput {
    modes: [String!]
    priority: String
  }

  input UserPreferencesInput {
    interests: [String!]
    budget_range: String
    travel_style: String
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User

    # Trip queries
    trip(id: ID!): Trip
    trips(user_id: ID!): [Trip!]!

    # Route queries
    route(id: ID!): Route
    routes(trip_id: ID!): [Route!]!
    calculateRoute(origin: LocationInput!, destination: LocationInput!, mode: TransportationMode!): Route

    # Recommendation queries
    recommendation(id: ID!): Recommendation
    recommendations(trip_id: ID!): [Recommendation!]!
    getRecommendations(trip_id: ID!, type: RecommendationType): [Recommendation!]!

    # Analysis
    analyzeTripCost(trip_id: ID!): TripAnalysis!
  }

  type Mutation {
    # Auth mutations
    register(email: String!, password: String!, name: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # User mutations
    updateUserPreferences(preferences: UserPreferencesInput!): User!

    # Trip mutations
    createTrip(input: TripInput!): Trip!
    updateTrip(id: ID!, input: TripInput!): Trip!
    deleteTrip(id: ID!): Boolean!

    # Route mutations
    addRouteToTrip(trip_id: ID!, origin: LocationInput!, destination: LocationInput!, mode: TransportationMode!): Route!

    # Recommendation mutations
    generateRecommendations(trip_id: ID!): [Recommendation!]!
    saveRecommendation(trip_id: ID!, recommendation_id: ID!): Boolean!
  }
`);

module.exports = schema;
