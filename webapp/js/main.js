// Main page JavaScript

let allTrips = [];
let currentFilter = 'all';

// Load trips on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadTrips();
    setupFilterButtons();
});

// Load trips from API
async function loadTrips() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tripsGrid = document.getElementById('tripsGrid');

    if (!isLoggedIn()) {
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.querySelector('p').textContent = '로그인하여 여행을 만들어보세요!';
        return;
    }

    const user = getCurrentUser();

    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        tripsGrid.style.display = 'none';

        // Fetch trips from API
        allTrips = await api.getTrips(user.id);

        if (allTrips.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            loadingState.style.display = 'none';
            tripsGrid.style.display = 'grid';
            renderTrips(allTrips);
        }
    } catch (error) {
        console.error('Error loading trips:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = '여행을 불러오는데 실패했습니다';
        emptyState.querySelector('p').textContent = error.message;
    }
}

// Render trips to grid
function renderTrips(trips) {
    const tripsGrid = document.getElementById('tripsGrid');
    tripsGrid.innerHTML = '';

    trips.forEach(trip => {
        const tripCard = createTripCard(trip);
        tripsGrid.appendChild(tripCard);
    });
}

// Create trip card element
function createTripCard(trip) {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.onclick = () => viewTrip(trip.id);

    const statusClass = `status-${trip.status}`;
    const statusText = {
        'planning': '계획중',
        'confirmed': '확정됨',
        'ongoing': '진행중',
        'completed': '완료됨',
        'cancelled': '취소됨'
    }[trip.status] || trip.status;

    card.innerHTML = `
        <div class="trip-card-header">
            <h3 class="trip-title">${trip.title}</h3>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="trip-info">
            <i class="fas fa-map-marker-alt"></i>
            <span>${trip.origin.name || trip.origin.address}</span>
        </div>
        <div class="trip-info">
            <i class="fas fa-map-marker-alt"></i>
            <span>${trip.destination.name || trip.destination.address}</span>
        </div>
        <div class="trip-footer">
            <span class="trip-date">
                ${utils.formatDate(trip.start_date)} - ${utils.formatDate(trip.end_date)}
            </span>
            <span class="trip-budget">
                ${utils.formatCurrency(trip.budget, trip.budget_currency)}
            </span>
        </div>
    `;

    return card;
}

// View trip details
function viewTrip(tripId) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_TRIP, tripId);
    window.location.href = `pages/trip-map.html?id=${tripId}`;
}

// Setup filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter trips
            currentFilter = btn.dataset.filter;
            const filteredTrips = filterTrips(allTrips, currentFilter);
            renderTrips(filteredTrips);
        });
    });
}

// Filter trips by status
function filterTrips(trips, filter) {
    if (filter === 'all') {
        return trips;
    }

    return trips.filter(trip => trip.status === filter);
}
