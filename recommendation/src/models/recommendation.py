from pydantic import BaseModel
from typing import List, Optional

class Location(BaseModel):
    address: str
    lat: float
    lng: float
    name: Optional[str] = None

class RecommendationModel(BaseModel):
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

    class Config:
        json_schema_extra = {
            "example": {
                "type": "restaurant",
                "name": "Traditional Korean BBQ",
                "description": "Authentic Korean BBQ experience",
                "location": {
                    "address": "123 Main St, Seoul",
                    "lat": 37.5665,
                    "lng": 126.9780,
                    "name": "BBQ House"
                },
                "rating": 4.5,
                "price_range": "moderate",
                "estimated_cost": 35000,
                "estimated_duration_minutes": 90,
                "score": 0.85,
                "tags": ["korean", "bbq", "traditional"],
                "images": []
            }
        }
