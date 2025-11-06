import numpy as np
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity

class CollaborativeFilter:
    """
    Collaborative Filtering algorithm for travel recommendations.
    Uses user preferences and destination characteristics to generate
    personalized recommendations.
    """

    def __init__(self):
        # Sample destination database (would be replaced with real data)
        self.destinations = self._load_destination_data()
        self.user_profiles = {}

    def _load_destination_data(self):
        """Load sample destination data"""
        return {
            "restaurants": [
                {
                    "name": "Traditional Korean BBQ",
                    "type": "restaurant",
                    "tags": ["korean", "bbq", "traditional", "popular"],
                    "price_range": "moderate",
                    "estimated_cost": 35000,
                    "duration_minutes": 90,
                    "rating": 4.5
                },
                {
                    "name": "Seafood Market Restaurant",
                    "type": "restaurant",
                    "tags": ["seafood", "market", "fresh", "local"],
                    "price_range": "moderate",
                    "estimated_cost": 40000,
                    "duration_minutes": 75,
                    "rating": 4.3
                },
                {
                    "name": "Fine Dining Experience",
                    "type": "restaurant",
                    "tags": ["fine_dining", "luxury", "fusion"],
                    "price_range": "expensive",
                    "estimated_cost": 80000,
                    "duration_minutes": 120,
                    "rating": 4.8
                }
            ],
            "attractions": [
                {
                    "name": "Historic Temple",
                    "type": "attraction",
                    "tags": ["temple", "historic", "culture", "religious"],
                    "price_range": "budget",
                    "estimated_cost": 5000,
                    "duration_minutes": 90,
                    "rating": 4.6
                },
                {
                    "name": "Beach Resort",
                    "type": "attraction",
                    "tags": ["beach", "nature", "water", "relaxation"],
                    "price_range": "budget",
                    "estimated_cost": 3000,
                    "duration_minutes": 180,
                    "rating": 4.4
                },
                {
                    "name": "Modern Art Museum",
                    "type": "attraction",
                    "tags": ["museum", "art", "culture", "indoor"],
                    "price_range": "moderate",
                    "estimated_cost": 15000,
                    "duration_minutes": 120,
                    "rating": 4.5
                }
            ],
            "accommodations": [
                {
                    "name": "Luxury Hotel",
                    "type": "accommodation",
                    "tags": ["hotel", "luxury", "service", "central"],
                    "price_range": "luxury",
                    "estimated_cost": 200000,
                    "duration_minutes": 0,
                    "rating": 4.7
                },
                {
                    "name": "Boutique Guesthouse",
                    "type": "accommodation",
                    "tags": ["guesthouse", "cozy", "local", "charming"],
                    "price_range": "moderate",
                    "estimated_cost": 80000,
                    "duration_minutes": 0,
                    "rating": 4.5
                },
                {
                    "name": "Budget Hostel",
                    "type": "accommodation",
                    "tags": ["hostel", "budget", "social", "backpacker"],
                    "price_range": "budget",
                    "estimated_cost": 30000,
                    "duration_minutes": 0,
                    "rating": 4.2
                }
            ],
            "activities": [
                {
                    "name": "Mountain Hiking Tour",
                    "type": "activity",
                    "tags": ["hiking", "nature", "adventure", "outdoor"],
                    "price_range": "moderate",
                    "estimated_cost": 50000,
                    "duration_minutes": 240,
                    "rating": 4.6
                },
                {
                    "name": "City Food Tour",
                    "type": "activity",
                    "tags": ["food", "tour", "culture", "local"],
                    "price_range": "moderate",
                    "estimated_cost": 60000,
                    "duration_minutes": 180,
                    "rating": 4.7
                },
                {
                    "name": "Spa & Wellness",
                    "type": "activity",
                    "tags": ["spa", "wellness", "relaxation", "indoor"],
                    "price_range": "expensive",
                    "estimated_cost": 100000,
                    "duration_minutes": 120,
                    "rating": 4.5
                }
            ]
        }

    def generate_recommendations(
        self,
        destination,
        preferences,
        budget: float,
        duration_days: int
    ) -> List[Dict]:
        """
        Generate recommendations using collaborative filtering approach.
        """
        recommendations = []

        # Extract user interests
        user_interests = set(preferences.interests) if preferences.interests else set()
        travel_style = preferences.travel_style
        budget_range = preferences.budget_range

        # Calculate daily budget
        daily_budget = budget / duration_days if duration_days > 0 else budget

        # Process each category
        for category, items in self.destinations.items():
            for item in items:
                # Calculate similarity score
                score = self._calculate_similarity_score(
                    item,
                    user_interests,
                    travel_style,
                    budget_range,
                    daily_budget
                )

                if score > 0.3:  # Threshold for recommendations
                    recommendations.append({
                        "type": item["type"],
                        "name": item["name"],
                        "description": f"A {item['type']} experience",
                        "location": {
                            "address": destination.address,
                            "lat": destination.lat + np.random.uniform(-0.05, 0.05),
                            "lng": destination.lng + np.random.uniform(-0.05, 0.05),
                            "name": item["name"]
                        },
                        "rating": item["rating"],
                        "price_range": item["price_range"],
                        "estimated_cost": item["estimated_cost"],
                        "estimated_duration_minutes": item["duration_minutes"],
                        "score": round(score, 4),
                        "tags": item["tags"],
                        "images": []
                    })

        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return recommendations

    def _calculate_similarity_score(
        self,
        item: Dict,
        user_interests: set,
        travel_style: str,
        budget_range: str,
        daily_budget: float
    ) -> float:
        """
        Calculate similarity score between item and user preferences.
        """
        score = 0.5  # Base score

        # Interest matching
        item_tags = set(item["tags"])
        if user_interests:
            interest_overlap = len(user_interests.intersection(item_tags))
            score += (interest_overlap / len(user_interests)) * 0.3

        # Budget matching
        price_scores = {
            "budget": {"budget": 1.0, "moderate": 0.5, "expensive": 0.2, "luxury": 0.1},
            "medium": {"budget": 0.8, "moderate": 1.0, "expensive": 0.6, "luxury": 0.3},
            "high": {"budget": 0.5, "moderate": 0.8, "expensive": 1.0, "luxury": 0.8}
        }
        budget_score = price_scores.get(budget_range, {}).get(item["price_range"], 0.5)
        score += budget_score * 0.25

        # Travel style matching
        style_preferences = {
            "adventure": ["hiking", "adventure", "outdoor", "nature"],
            "relaxation": ["spa", "beach", "relaxation", "wellness"],
            "culture": ["museum", "temple", "culture", "historic"],
            "balanced": []  # Matches all
        }

        if travel_style != "balanced":
            style_tags = set(style_preferences.get(travel_style, []))
            if style_tags.intersection(item_tags):
                score += 0.15

        # Rating factor
        score += (item["rating"] / 5.0) * 0.1

        # Cost efficiency
        if item["estimated_cost"] <= daily_budget * 0.3:
            score += 0.1
        elif item["estimated_cost"] > daily_budget:
            score -= 0.2

        return min(max(score, 0), 1)
