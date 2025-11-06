import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchTrips = createAsyncThunk(
  'trip/fetchTrips',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post('/graphql', {
        query: `
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
        `
      });

      return response.data.data.trips;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors?.[0]?.message || 'Failed to fetch trips');
    }
  }
);

export const createTrip = createAsyncThunk(
  'trip/createTrip',
  async (tripData, { rejectWithValue }) => {
    try {
      const response = await api.post('/graphql', {
        query: `
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
              origin {
                address
                lat
                lng
              }
              destination {
                address
                lat
                lng
              }
              start_date
              end_date
              budget
              status
            }
          }
        `
      });

      return response.data.data.createTrip;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors?.[0]?.message || 'Failed to create trip');
    }
  }
);

export const fetchTripDetails = createAsyncThunk(
  'trip/fetchTripDetails',
  async (tripId, { rejectWithValue }) => {
    try {
      const response = await api.post('/graphql', {
        query: `
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
              }
            }
          }
        `
      });

      return response.data.data.trip;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors?.[0]?.message || 'Failed to fetch trip details');
    }
  }
);

// Slice
const tripSlice = createSlice({
  name: 'trip',
  initialState: {
    trips: [],
    currentTrip: null,
    loading: false,
    error: null
  },
  reducers: {
    clearCurrentTrip: (state) => {
      state.currentTrip = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch trips
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create trip
      .addCase(createTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips.unshift(action.payload);
        state.currentTrip = action.payload;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch trip details
      .addCase(fetchTripDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchTripDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentTrip, clearError } = tripSlice.actions;
export default tripSlice.reducer;
