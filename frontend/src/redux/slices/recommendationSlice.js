import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const generateRecommendations = createAsyncThunk(
  'recommendation/generateRecommendations',
  async (tripId, { rejectWithValue }) => {
    try {
      const response = await api.post('/graphql', {
        query: `
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
        `
      });

      return response.data.data.generateRecommendations;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors?.[0]?.message || 'Failed to generate recommendations');
    }
  }
);

const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState: {
    recommendations: [],
    loading: false,
    error: null
  },
  reducers: {
    clearRecommendations: (state) => {
      state.recommendations = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload;
      })
      .addCase(generateRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearRecommendations } = recommendationSlice.actions;
export default recommendationSlice.reducer;
