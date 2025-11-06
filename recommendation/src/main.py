from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from algorithms.collaborative_filtering import CollaborativeFilter
from algorithms.budget_optimizer import BudgetOptimizer
from models.recommendation import RecommendationModel

app = FastAPI(title="TripSync Recommendation Engine")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
cf_model = CollaborativeFilter()
budget_optimizer = BudgetOptimizer()

class Location(BaseModel):
    address: str
    lat: float
    lng: float
    name: Optional[str] = None

class UserPreferences(BaseModel):
    interests: List[str] = []
    budget_range: str = "medium"
    travel_style: str = "balanced"

class TransportationPreferences(BaseModel):
    modes: List[str] = ["bus", "train", "flight"]
    priority: str = "balanced"

class RecommendationRequest(BaseModel):
    destination: Location
    budget: float
    duration_days: int
    preferences: Optional[UserPreferences] = None
    transportation_preferences: Optional[TransportationPreferences] = None

class RecommendationResponse(BaseModel):
    type: str
    name: str
    description: Optional[str] = None
    location: Location
    rating: Optional[float] = None
    price_range: str
    estimated_cost: float
    estimated_duration_minutes: int
    score: float
    tags: List[str] = []
    images: List[str] = []

@app.get("/")
async def root():
    return {
        "service": "TripSync Recommendation Engine",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/recommend", response_model=Dict[str, List[RecommendationResponse]])
async def get_recommendations(request: RecommendationRequest):
    """
    Generate personalized travel recommendations based on collaborative filtering
    and budget optimization algorithms.
    """
    try:
        # Get user preferences
        preferences = request.preferences or UserPreferences()

        # Generate recommendations using collaborative filtering
        cf_recommendations = cf_model.generate_recommendations(
            destination=request.destination,
            preferences=preferences,
            budget=request.budget,
            duration_days=request.duration_days
        )

        # Optimize recommendations based on budget constraints
        optimized_recommendations = budget_optimizer.optimize(
            recommendations=cf_recommendations,
            budget=request.budget,
            duration_days=request.duration_days
        )

        return {
            "recommendations": optimized_recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize-itinerary")
async def optimize_itinerary(
    recommendations: List[Dict],
    budget: float,
    duration_days: int
):
    """
    Optimize itinerary using budget constraints and time optimization.
    """
    try:
        optimized = budget_optimizer.optimize_itinerary(
            recommendations=recommendations,
            budget=budget,
            duration_days=duration_days
        )

        return {
            "optimized_itinerary": optimized,
            "total_cost": sum(rec["estimated_cost"] for rec in optimized),
            "budget_utilization": sum(rec["estimated_cost"] for rec in optimized) / budget * 100
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
