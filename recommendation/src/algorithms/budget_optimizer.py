from typing import List, Dict
import numpy as np

class BudgetOptimizer:
    """
    Budget constraint optimization algorithm for travel itinerary.
    Uses a variant of the knapsack problem to maximize value within budget.
    """

    def optimize(
        self,
        recommendations: List[Dict],
        budget: float,
        duration_days: int
    ) -> List[Dict]:
        """
        Optimize recommendations based on budget constraints.
        Uses greedy approach with value-to-cost ratio.
        """
        if not recommendations:
            return []

        # Calculate value-to-cost ratio for each recommendation
        for rec in recommendations:
            cost = rec.get("estimated_cost", 0)
            score = rec.get("score", 0)
            rec["value_ratio"] = score / cost if cost > 0 else 0

        # Sort by value ratio (descending)
        sorted_recommendations = sorted(
            recommendations,
            key=lambda x: x["value_ratio"],
            reverse=True
        )

        # Allocate budget
        selected = []
        remaining_budget = budget
        daily_budget = budget / duration_days if duration_days > 0 else budget

        # Essential allocations (accommodation)
        accommodation_budget = daily_budget * duration_days * 0.4
        transportation_budget = budget * 0.2
        activity_budget = budget - accommodation_budget - transportation_budget

        # Select items based on category budgets
        accommodations = [r for r in sorted_recommendations if r["type"] == "accommodation"]
        restaurants = [r for r in sorted_recommendations if r["type"] == "restaurant"]
        attractions = [r for r in sorted_recommendations if r["type"] == "attraction"]
        activities = [r for r in sorted_recommendations if r["type"] == "activity"]

        # Add accommodation (one per night)
        selected_accommodation = self._select_best_fit(
            accommodations,
            accommodation_budget,
            duration_days
        )
        selected.extend(selected_accommodation)

        # Add restaurants (3 per day)
        selected_restaurants = self._select_best_fit(
            restaurants,
            activity_budget * 0.4,
            duration_days * 3
        )
        selected.extend(selected_restaurants)

        # Add attractions and activities
        remaining = activity_budget * 0.6
        selected_attractions = self._select_best_fit(
            attractions + activities,
            remaining,
            duration_days * 2
        )
        selected.extend(selected_attractions)

        return selected

    def _select_best_fit(
        self,
        items: List[Dict],
        budget: float,
        max_count: int
    ) -> List[Dict]:
        """
        Select best items within budget using greedy knapsack approach.
        """
        selected = []
        current_cost = 0

        for item in items:
            if len(selected) >= max_count:
                break

            cost = item.get("estimated_cost", 0)
            if current_cost + cost <= budget:
                selected.append(item)
                current_cost += cost

        return selected

    def optimize_itinerary(
        self,
        recommendations: List[Dict],
        budget: float,
        duration_days: int
    ) -> List[Dict]:
        """
        Create optimized daily itinerary with time and budget constraints.
        """
        # First optimize by budget
        optimized = self.optimize(recommendations, budget, duration_days)

        # Group by days
        itinerary = []
        daily_budget = budget / duration_days if duration_days > 0 else budget

        # Separate by type
        accommodations = [r for r in optimized if r["type"] == "accommodation"]
        restaurants = [r for r in optimized if r["type"] == "restaurant"]
        attractions = [r for r in optimized if r["type"] in ["attraction", "activity"]]

        for day in range(duration_days):
            day_plan = {
                "day": day + 1,
                "items": [],
                "total_cost": 0,
                "total_duration": 0
            }

            # Add accommodation
            if day < len(accommodations):
                acc = accommodations[day]
                day_plan["items"].append(acc)
                day_plan["total_cost"] += acc["estimated_cost"]

            # Add meals (breakfast, lunch, dinner)
            meal_times = ["breakfast", "lunch", "dinner"]
            for i, meal_time in enumerate(meal_times):
                idx = day * 3 + i
                if idx < len(restaurants):
                    restaurant = restaurants[idx].copy()
                    restaurant["meal_time"] = meal_time
                    day_plan["items"].append(restaurant)
                    day_plan["total_cost"] += restaurant["estimated_cost"]
                    day_plan["total_duration"] += restaurant["estimated_duration_minutes"]

            # Add attractions (2-3 per day)
            attractions_per_day = 2
            start_idx = day * attractions_per_day
            end_idx = start_idx + attractions_per_day

            for attraction in attractions[start_idx:end_idx]:
                if day_plan["total_duration"] + attraction["estimated_duration_minutes"] <= 600:  # 10 hours max
                    day_plan["items"].append(attraction)
                    day_plan["total_cost"] += attraction["estimated_cost"]
                    day_plan["total_duration"] += attraction["estimated_duration_minutes"]

            itinerary.append(day_plan)

        return itinerary

    def calculate_budget_distribution(
        self,
        budget: float,
        duration_days: int,
        preferences: Dict = None
    ) -> Dict[str, float]:
        """
        Calculate recommended budget distribution across categories.
        """
        distribution = {
            "accommodation": budget * 0.35,
            "food": budget * 0.25,
            "transportation": budget * 0.20,
            "attractions": budget * 0.15,
            "miscellaneous": budget * 0.05
        }

        # Adjust based on travel style
        if preferences:
            travel_style = preferences.get("travel_style", "balanced")
            if travel_style == "luxury":
                distribution["accommodation"] = budget * 0.45
                distribution["food"] = budget * 0.30
                distribution["attractions"] = budget * 0.15
            elif travel_style == "budget":
                distribution["accommodation"] = budget * 0.25
                distribution["food"] = budget * 0.20
                distribution["transportation"] = budget * 0.25
                distribution["attractions"] = budget * 0.25

        return distribution
