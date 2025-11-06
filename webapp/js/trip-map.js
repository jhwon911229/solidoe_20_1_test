// Trip Map Page JavaScript

let map;
let directionsService;
let directionsRenderer;
let currentTrip = null;
let currentMode = 'DRIVING';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    // Get trip ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('id');

    if (!tripId) {
        utils.showToast('여행 ID가 없습니다.', 'error');
        window.location.href = '../index.html';
        return;
    }

    // Load trip data
    await loadTripData(tripId);

    // Initialize map
    initMap();

    // Setup transport mode buttons
    setupTransportButtons();

    // Setup navigation buttons
    setupNavigationButtons();
});

// Load trip data
async function loadTripData(tripId) {
    try {
        currentTrip = await api.getTrip(tripId);

        // Update UI with trip data
        document.getElementById('tripTitle').textContent = currentTrip.title;
        document.getElementById('originName').textContent = currentTrip.origin.name || currentTrip.origin.address;
        document.getElementById('destinationName').textContent = currentTrip.destination.name || currentTrip.destination.address;

        const tripDays = utils.daysBetween(currentTrip.start_date, currentTrip.end_date) + 1;
        document.getElementById('tripDates').textContent = `${utils.formatDate(currentTrip.start_date)} - ${utils.formatDate(currentTrip.end_date)} (${tripDays}일)`;
        document.getElementById('tripBudget').textContent = utils.formatCurrency(currentTrip.budget, currentTrip.budget_currency);

    } catch (error) {
        console.error('Error loading trip:', error);
        utils.showToast('여행 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// Initialize Google Map
function initMap() {
    if (!currentTrip) return;

    // Calculate center point between origin and destination
    const centerLat = (currentTrip.origin.lat + currentTrip.destination.lat) / 2;
    const centerLng = (currentTrip.origin.lng + currentTrip.destination.lng) / 2;

    // Initialize map
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: centerLat, lng: centerLng },
        zoom: 8,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
    });

    // Initialize directions service and renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false
    });

    // Calculate and display initial route
    calculateAndDisplayRoute(currentMode);
}

// Calculate and display route
async function calculateAndDisplayRoute(travelMode) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const request = {
            origin: { lat: currentTrip.origin.lat, lng: currentTrip.origin.lng },
            destination: { lat: currentTrip.destination.lat, lng: currentTrip.destination.lng },
            travelMode: google.maps.TravelMode[travelMode]
        };

        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);

                // Display route information
                displayRouteInfo(result);

                loadingOverlay.style.display = 'none';
            } else {
                console.error('Directions request failed:', status);
                utils.showToast('경로를 계산할 수 없습니다.', 'error');
                loadingOverlay.style.display = 'none';
            }
        });

    } catch (error) {
        console.error('Error calculating route:', error);
        utils.showToast('경로 계산 중 오류가 발생했습니다.', 'error');
        loadingOverlay.style.display = 'none';
    }
}

// Display route information
function displayRouteInfo(result) {
    const route = result.routes[0].legs[0];

    // Show route info panel
    const routeInfo = document.getElementById('routeInfo');
    routeInfo.style.display = 'block';

    // Update distance
    document.getElementById('routeDistance').textContent = route.distance.text;

    // Update duration
    document.getElementById('routeDuration').textContent = route.duration.text;

    // Estimate cost based on travel mode
    const distanceKm = route.distance.value / 1000;
    const costPerKm = CONFIG.TRANSPORT_COSTS[currentMode] || 0;
    const estimatedCost = Math.round(distanceKm * costPerKm);
    document.getElementById('routeCost').textContent = utils.formatCurrency(estimatedCost);

    // Display directions
    displayDirections(route.steps);
}

// Display turn-by-turn directions
function displayDirections(steps) {
    const directionsList = document.getElementById('directionsList');
    directionsList.innerHTML = '';

    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'direction-step';
        stepDiv.innerHTML = `
            <strong>${index + 1}.</strong> ${step.instructions}
            <br><small>${step.distance.text} - ${step.duration.text}</small>
        `;
        directionsList.appendChild(stepDiv);
    });
}

// Setup transport mode buttons
function setupTransportButtons() {
    const transportButtons = document.querySelectorAll('.transport-btn');

    transportButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            transportButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update current mode and recalculate route
            currentMode = btn.dataset.mode;
            calculateAndDisplayRoute(currentMode);
        });
    });
}

// Setup navigation buttons
function setupNavigationButtons() {
    document.getElementById('viewRecommendations').href = `recommendations.html?id=${currentTrip.id}`;
    document.getElementById('viewBudget').href = `budget.html?id=${currentTrip.id}`;
    document.getElementById('backToTrip').href = '../index.html';
}

// Close route info panel
function closeRouteInfo() {
    document.getElementById('routeInfo').style.display = 'none';
}

// Save route
async function saveRoute() {
    utils.showToast('경로가 저장되었습니다!', 'success');
    // Implement save functionality if needed
}
