// API Client for TripSync

class APIClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.graphqlURL = CONFIG.GRAPHQL_ENDPOINT;
    }

    // Get auth token
    getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    // Make GraphQL request
    async graphqlRequest(query, variables = {}) {
        try {
            const token = this.getToken();
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(this.graphqlURL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, variables })
            });

            const data = await response.json();

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            return data.data;
        } catch (error) {
            console.error('GraphQL Error:', error);
            throw error;
        }
    }

    // Make REST API request
    async restRequest(endpoint, options = {}) {
        try {
            const token = this.getToken();
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('REST API Error:', error);
            throw error;
        }
    }

    // Auth APIs
    async login(email, password) {
        const query = `
            mutation {
                login(email: "${email}", password: "${password}") {
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
        `;

        const data = await this.graphqlRequest(query);
        return data.login;
    }

    async register(name, email, password) {
        const query = `
            mutation {
                register(name: "${name}", email: "${email}", password: "${password}") {
                    token
                    user {
                        id
                        email
                        name
                    }
                }
            }
        `;

        const data = await this.graphqlRequest(query);
        return data.register;
    }

    // Trip APIs
    async getTrips(userId) {
        const query = `
            query {
                trips(user_id: "${userId}") {
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
                    budget_currency
                    status
                    travelers_count
                }
            }
        `;

        const data = await this.graphqlRequest(query);
        return data.trips;
    }

    async getTrip(tripId) {
        const query = `
            query {
                trip(id: "${tripId}") {
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
                    budget_currency
                    status
                    travelers_count
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
            }
        `;

        const data = await this.graphqlRequest(query);
        return data.trip;
    }

    async createTrip(tripData) {
        const query = `
            mutation {
                createTrip(input: {
                    title: "${tripData.title}"
                    origin: {
                        address: "${tripData.origin.address}"
                        lat: ${tripData.origin.lat}
                        lng: ${tripData.origin.lng}
                        name: "${tripData.origin.name || ''}"
                    }
                    destination: {
                        address: "${tripData.destination.address}"
                        lat: ${tripData.destination.lat}
                        lng: ${tripData.destination.lng}
                        name: "${tripData.destination.name || ''}"
                    }
                    start_date: "${tripData.start_date}"
                    end_date: "${tripData.end_date}"
                    budget: ${tripData.budget}
                    budget_currency: "${tripData.budget_currency || 'KRW'}"
                    travelers_count: ${tripData.travelers_count || 1}
                }) {
                    id
                    title
                    status
                }
            }
        `;

        const data = await this.graphqlRequest(query);
        return data.createTrip;
    }

    // Route APIs
    async calculateRoute(origin, destination, mode) {
        const endpoint = `/api/transportation-options?origin=${encodeURIComponent(JSON.stringify(origin))}&destination=${encodeURIComponent(JSON.stringify(destination))}`;
        return await this.restRequest(endpoint);
    }

    // Recommendation APIs
    async generateRecommendations(tripId) {
        const query = `
            mutation {
                generateRecommendations(trip_id: "${tripId}") {
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
        `;

        const data = await this.graphqlRequest(query);
        return data.generateRecommendations;
    }

    // Budget Analysis APIs
    async analyzeTripCost(tripId) {
        const query = `
            query {
                analyzeTripCost(trip_id: "${tripId}") {
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
        `;

        const data = await this.graphqlRequest(query);
        return data.analyzeTripCost;
    }

    // Google Maps Integration
    async geocodeAddress(address) {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    address: result.formatted_address,
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    name: address
                };
            }

            throw new Error('주소를 찾을 수 없습니다.');
        } catch (error) {
            console.error('Geocoding Error:', error);
            throw error;
        }
    }
}

// Create global API client instance
const api = new APIClient();
