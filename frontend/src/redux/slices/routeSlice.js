import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const calculateRoute = createAsyncThunk(
  'route/calculateRoute',
  async ({ origin, destination, mode }, { rejectWithValue }) => {
    try {
      const response = await api.post('/graphql', {
        query: `
          query {
            calculateRoute(
              origin: {
                address: "${origin.address}"
                lat: ${origin.lat}
                lng: ${origin.lng}
              }
              destination: {
                address: "${destination.address}"
                lat: ${destination.lat}
                lng: ${destination.lng}
              }
              mode: ${mode}
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
        `
      });

      return response.data.data.calculateRoute;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors?.[0]?.message || 'Failed to calculate route');
    }
  }
);

const routeSlice = createSlice({
  name: 'route',
  initialState: {
    currentRoute: null,
    routes: [],
    loading: false,
    error: null
  },
  reducers: {
    clearRoute: (state) => {
      state.currentRoute = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(calculateRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoute = action.payload;
      })
      .addCase(calculateRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearRoute } = routeSlice.actions;
export default routeSlice.reducer;
