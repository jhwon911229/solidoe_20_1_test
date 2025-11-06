// TripSync Application
class TripSyncApp {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.googleMapsApiKey = null;
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.selectedOrigin = null;
        this.selectedDestination = null;
        this.trips = [];
        this.currentTrip = null;

        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.loadGoogleMapsScript();
        this.loadTrips();
        this.loadRecommendations();
        this.updateBudgetDisplay();
    }

    async loadConfig() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/config`);
            const config = await response.json();
            this.googleMapsApiKey = config.googleMapsApiKey;
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    loadGoogleMapsScript() {
        if (!this.googleMapsApiKey) {
            console.error('Google Maps API key not found');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    initMap() {
        const mapElement = document.getElementById('map');

        this.map = new google.maps.Map(mapElement, {
            center: { lat: 37.5665, lng: 126.9780 }, // Seoul
            zoom: 12,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            map: this.map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#4a90e2',
                strokeWeight: 5
            }
        });

        this.setupPlaceAutocomplete();
    }

    setupPlaceAutocomplete() {
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');

        const originAutocomplete = new google.maps.places.Autocomplete(originInput);
        const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);

        originAutocomplete.addListener('place_changed', () => {
            const place = originAutocomplete.getPlace();
            if (place.geometry) {
                this.selectedOrigin = {
                    name: place.name,
                    address: place.formatted_address,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
            }
        });

        destinationAutocomplete.addListener('place_changed', () => {
            const place = destinationAutocomplete.getPlace();
            if (place.geometry) {
                this.selectedDestination = {
                    name: place.name,
                    address: place.formatted_address,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
            }
        });
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Trip form
        const tripForm = document.getElementById('trip-form');
        if (tripForm) {
            tripForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTripSubmit();
            });
        }

        // Budget slider
        const budgetSlider = document.getElementById('budget-slider');
        const budgetInput = document.getElementById('budget');
        const budgetDisplay = document.getElementById('budget-display');

        if (budgetSlider && budgetInput) {
            budgetSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                budgetInput.value = value;
                budgetDisplay.textContent = this.formatCurrency(value);
            });

            budgetInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                budgetSlider.value = value;
                budgetDisplay.textContent = this.formatCurrency(value);
            });
        }

        // Recommendation filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.getAttribute('data-type');
                this.loadRecommendations(type === 'all' ? null : type);
            });
        });

        // Set default dates
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        if (startDateInput && endDateInput) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            startDateInput.valueAsDate = today;
            endDateInput.valueAsDate = tomorrow;
            startDateInput.min = today.toISOString().split('T')[0];
            endDateInput.min = tomorrow.toISOString().split('T')[0];

            startDateInput.addEventListener('change', () => {
                const startDate = new Date(startDateInput.value);
                const minEndDate = new Date(startDate);
                minEndDate.setDate(minEndDate.getDate() + 1);
                endDateInput.min = minEndDate.toISOString().split('T')[0];
            });
        }
    }

    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Reload data based on tab
        if (tabName === 'trips') {
            this.loadTrips();
        } else if (tabName === 'recommendations') {
            this.loadRecommendations();
        } else if (tabName === 'budget') {
            this.updateBudgetDisplay();
        }
    }

    async handleTripSubmit() {
        const title = document.getElementById('trip-title').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const budget = document.getElementById('budget').value;

        if (!this.selectedOrigin || !this.selectedDestination) {
            alert('출발지와 목적지를 모두 선택해주세요.');
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Calculate route
            const route = await this.calculateRoute(this.selectedOrigin, this.selectedDestination);

            // Create trip
            const tripData = {
                title,
                origin: this.selectedOrigin,
                destination: this.selectedDestination,
                startDate,
                endDate,
                budget: parseFloat(budget)
            };

            const response = await fetch(`${this.API_BASE_URL}/trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tripData)
            });

            if (response.ok) {
                const trip = await response.json();
                this.currentTrip = trip;
                this.trips.push(trip);

                // Display route on map
                this.displayRoute(route);

                alert('여행 계획이 성공적으로 생성되었습니다!');

                // Switch to trips tab
                this.switchTab('trips');
            } else {
                throw new Error('Failed to create trip');
            }
        } catch (error) {
            console.error('Error creating trip:', error);
            alert('여행 계획 생성 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    async calculateRoute(origin, destination) {
        return new Promise((resolve, reject) => {
            if (!this.directionsService) {
                reject('Directions service not initialized');
                return;
            }

            const request = {
                origin: new google.maps.LatLng(origin.lat, origin.lng),
                destination: new google.maps.LatLng(destination.lat, destination.lng),
                travelMode: google.maps.TravelMode.DRIVING
            };

            this.directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    const route = result.routes[0].legs[0];
                    resolve({
                        distance: route.distance.text,
                        duration: route.duration.text,
                        steps: route.steps.map(step => ({
                            instruction: step.instructions,
                            distance: step.distance.text,
                            duration: step.duration.text
                        }))
                    });
                } else {
                    reject('Failed to calculate route: ' + status);
                }
            });
        });
    }

    displayRoute(route) {
        if (!this.directionsRenderer || !route) return;

        const request = {
            origin: new google.maps.LatLng(this.selectedOrigin.lat, this.selectedOrigin.lng),
            destination: new google.maps.LatLng(this.selectedDestination.lat, this.selectedDestination.lng),
            travelMode: google.maps.TravelMode.DRIVING
        };

        this.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                this.directionsRenderer.setDirections(result);

                // Display route info
                const routeInfo = document.getElementById('route-info');
                routeInfo.style.display = 'block';

                document.getElementById('route-distance').textContent = route.distance;
                document.getElementById('route-duration').textContent = route.duration;

                // Estimate cost (rough calculation)
                const distanceValue = parseFloat(route.distance.replace(/[^0-9.]/g, ''));
                const estimatedCost = Math.round(distanceValue * 150); // 150원/km
                document.getElementById('route-cost').textContent = this.formatCurrency(estimatedCost);
            }
        });
    }

    async loadTrips() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/trips`);
            const trips = await response.json();
            this.trips = trips;
            this.displayTrips();
        } catch (error) {
            console.error('Error loading trips:', error);
        }
    }

    displayTrips() {
        const tripsList = document.getElementById('trips-list');
        const noTrips = document.getElementById('no-trips');

        if (this.trips.length === 0) {
            tripsList.innerHTML = '';
            noTrips.style.display = 'block';
            return;
        }

        noTrips.style.display = 'none';
        tripsList.innerHTML = this.trips.map(trip => `
            <div class="trip-card">
                <div class="trip-card-header">
                    <h3>${trip.title}</h3>
                    <div class="trip-route">
                        <i class="fas fa-location-dot"></i>
                        <span>${trip.origin.name}</span>
                        <i class="fas fa-arrow-right"></i>
                        <span>${trip.destination.name}</span>
                    </div>
                </div>
                <div class="trip-card-body">
                    <div class="trip-info">
                        <div class="trip-info-item">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(trip.startDate)} ~ ${this.formatDate(trip.endDate)}</span>
                        </div>
                        <div class="trip-info-item">
                            <i class="fas fa-wallet"></i>
                            <span>예산: ${this.formatCurrency(trip.budget)}</span>
                        </div>
                        <div class="trip-info-item">
                            <i class="fas fa-info-circle"></i>
                            <span class="trip-status ${trip.status}">${this.getStatusText(trip.status)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadRecommendations(type = null) {
        try {
            const url = type
                ? `${this.API_BASE_URL}/recommendations?type=${type}`
                : `${this.API_BASE_URL}/recommendations`;

            const response = await fetch(url);
            const recommendations = await response.json();
            this.displayRecommendations(recommendations);
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    displayRecommendations(recommendations) {
        const recommendationsList = document.getElementById('recommendations-list');

        if (recommendations.length === 0) {
            recommendationsList.innerHTML = '<div class="no-data"><p>추천 정보가 없습니다.</p></div>';
            return;
        }

        recommendationsList.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card">
                <div class="recommendation-image">
                    <i class="fas fa-${this.getRecommendationIcon(rec)}"></i>
                </div>
                <div class="recommendation-body">
                    <h3>${rec.name}</h3>
                    <div class="recommendation-meta">
                        <div class="rating">
                            <i class="fas fa-star"></i>
                            <span>${rec.rating}</span>
                        </div>
                        <div class="price-level">
                            ${this.getPriceLevelSymbol(rec.priceLevel)}
                        </div>
                    </div>
                    <p>${rec.cuisine || rec.category || rec.stars + '성급'}</p>
                    <div class="recommendation-distance">
                        <i class="fas fa-location-dot"></i>
                        <span>${rec.distance}km</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateBudgetDisplay() {
        const totalBudget = this.trips.reduce((sum, trip) => sum + trip.budget, 0);
        const usedBudget = Math.round(totalBudget * 0.3); // Mock: 30% used
        const remainingBudget = totalBudget - usedBudget;

        document.getElementById('total-budget').textContent = this.formatCurrency(totalBudget);
        document.getElementById('used-budget').textContent = this.formatCurrency(usedBudget);
        document.getElementById('remaining-budget').textContent = this.formatCurrency(remainingBudget);

        // Simple budget chart (text-based)
        const chartCanvas = document.getElementById('budget-chart-canvas');
        if (chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            chartCanvas.width = chartCanvas.parentElement.clientWidth;
            chartCanvas.height = 300;

            // Draw simple bar chart
            const categories = ['교통', '숙박', '식사', '관광', '기타'];
            const values = [20, 30, 25, 15, 10]; // Percentages
            const colors = ['#4a90e2', '#f39c12', '#27ae60', '#e74c3c', '#95a5a6'];

            const barWidth = chartCanvas.width / categories.length - 20;
            const maxHeight = chartCanvas.height - 50;

            categories.forEach((category, index) => {
                const x = index * (barWidth + 20) + 10;
                const height = (values[index] / 100) * maxHeight;
                const y = chartCanvas.height - height - 30;

                // Draw bar
                ctx.fillStyle = colors[index];
                ctx.fillRect(x, y, barWidth, height);

                // Draw label
                ctx.fillStyle = '#2c3e50';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(category, x + barWidth / 2, chartCanvas.height - 10);
                ctx.fillText(values[index] + '%', x + barWidth / 2, y - 5);
            });
        }
    }

    getRecommendationIcon(rec) {
        if (rec.cuisine) return 'utensils';
        if (rec.category) return 'landmark';
        if (rec.stars) return 'hotel';
        return 'map-marker-alt';
    }

    getPriceLevelSymbol(level) {
        return '₩'.repeat(level || 1);
    }

    getStatusText(status) {
        const statusMap = {
            planning: '계획 중',
            confirmed: '확정됨',
            in_progress: '진행 중',
            completed: '완료됨',
            cancelled: '취소됨'
        };
        return statusMap[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

// Global function for Google Maps callback
function initMap() {
    if (window.tripSyncApp) {
        window.tripSyncApp.initMap();
    }
}

// Global function for tab switching
function switchTab(tabName) {
    if (window.tripSyncApp) {
        window.tripSyncApp.switchTab(tabName);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tripSyncApp = new TripSyncApp();
});
