// Recommendations Page JavaScript

let currentTrip = null;
let allRecommendations = [];
let currentFilter = 'all';
let currentSort = 'score';

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

    // Setup filter tabs
    setupFilterTabs();

    // Setup sort select
    setupSortSelect();

    // Setup back button
    document.getElementById('backToTrip').href = `trip-map.html?id=${tripId}`;
});

// Load trip data
async function loadTripData(tripId) {
    try {
        currentTrip = await api.getTrip(tripId);
        document.getElementById('tripTitle').textContent = `${currentTrip.title} - 추천 장소`;

        // Load existing recommendations if any
        if (currentTrip.recommendations && currentTrip.recommendations.length > 0) {
            allRecommendations = currentTrip.recommendations;
            displayRecommendations();
        }

    } catch (error) {
        console.error('Error loading trip:', error);
        utils.showToast('여행 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// Generate recommendations
async function generateRecommendations() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const grid = document.getElementById('recommendationsGrid');
    const generateBtn = document.getElementById('generateBtn');

    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        grid.style.display = 'none';
        generateBtn.disabled = true;

        // Generate recommendations via API
        allRecommendations = await api.generateRecommendations(currentTrip.id);

        if (allRecommendations.length === 0) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = '추천할 장소가 없습니다';
        } else {
            utils.showToast('추천이 생성되었습니다!', 'success');
            displayRecommendations();
        }

    } catch (error) {
        console.error('Error generating recommendations:', error);
        utils.showToast('추천 생성에 실패했습니다.', 'error');
        emptyState.style.display = 'block';
    } finally {
        loadingState.style.display = 'none';
        generateBtn.disabled = false;
    }
}

// Display recommendations
function displayRecommendations() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const grid = document.getElementById('recommendationsGrid');

    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    // Filter and sort
    let filtered = filterRecommendations(allRecommendations, currentFilter);
    filtered = sortRecommendations(filtered, currentSort);

    // Render
    grid.innerHTML = '';
    filtered.forEach(rec => {
        const card = createRecommendationCard(rec);
        grid.appendChild(card);
    });
}

// Create recommendation card
function createRecommendationCard(rec) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.onclick = () => showRecommendationDetail(rec);

    const typeIcons = {
        'restaurant': 'fa-utensils',
        'attraction': 'fa-landmark',
        'accommodation': 'fa-hotel',
        'activity': 'fa-hiking'
    };

    const typeLabels = {
        'restaurant': '맛집',
        'attraction': '관광지',
        'accommodation': '숙소',
        'activity': '액티비티'
    };

    const priceLabels = {
        'budget': '저렴',
        'moderate': '보통',
        'expensive': '비쌈',
        'luxury': '럭셔리'
    };

    card.innerHTML = `
        <div class="recommendation-image">
            <i class="fas ${typeIcons[rec.type] || 'fa-map-marker-alt'}"></i>
        </div>
        <div class="recommendation-content">
            <span class="recommendation-type">${typeLabels[rec.type] || rec.type}</span>
            <h3 class="recommendation-title">${rec.name}</h3>
            ${rec.rating ? `
                <div class="recommendation-rating">
                    <span class="rating-stars">
                        ${'★'.repeat(Math.round(rec.rating))}${'☆'.repeat(5 - Math.round(rec.rating))}
                    </span>
                    <span>${rec.rating.toFixed(1)}</span>
                </div>
            ` : ''}
            <div class="recommendation-info">
                <div><i class="fas fa-map-marker-alt"></i> ${rec.location.address}</div>
                <div><i class="fas fa-won-sign"></i> ${utils.formatCurrency(rec.estimated_cost)} (${priceLabels[rec.price_range] || rec.price_range})</div>
                ${rec.estimated_duration_minutes ? `<div><i class="fas fa-clock"></i> ${utils.formatDuration(rec.estimated_duration_minutes)}</div>` : ''}
            </div>
            <div class="recommendation-footer">
                <span class="recommendation-score">추천 점수: ${(rec.recommendation_score * 100).toFixed(0)}%</span>
            </div>
            ${rec.tags && rec.tags.length > 0 ? `
                <div class="recommendation-tags">
                    ${rec.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

// Show recommendation detail modal
function showRecommendationDetail(rec) {
    const modal = document.getElementById('detailModal');
    modal.classList.add('active');

    document.getElementById('modalTitle').textContent = rec.name;
    document.getElementById('modalLocation').textContent = rec.location.address;
    document.getElementById('modalRating').textContent = rec.rating ? `평점: ${rec.rating.toFixed(1)} / 5.0` : '평점 없음';
    document.getElementById('modalPrice').textContent = `${utils.formatCurrency(rec.estimated_cost)}`;
    document.getElementById('modalDuration').textContent = rec.estimated_duration_minutes ? utils.formatDuration(rec.estimated_duration_minutes) : '-';
    document.getElementById('modalDescription').textContent = rec.description || '설명이 없습니다.';

    // Display tags
    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = '';
    if (rec.tags && rec.tags.length > 0) {
        rec.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
    }

    // Close modal on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
}

// Close modal
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('active');
}

// Add to itinerary
function addToItinerary() {
    utils.showToast('일정에 추가되었습니다!', 'success');
    closeModal();
}

// Filter recommendations
function filterRecommendations(recommendations, filter) {
    if (filter === 'all') {
        return recommendations;
    }
    return recommendations.filter(rec => rec.type === filter);
}

// Sort recommendations
function sortRecommendations(recommendations, sortBy) {
    const sorted = [...recommendations];

    switch (sortBy) {
        case 'score':
            sorted.sort((a, b) => b.recommendation_score - a.recommendation_score);
            break;
        case 'rating':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'price-low':
            sorted.sort((a, b) => a.estimated_cost - b.estimated_cost);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.estimated_cost - a.estimated_cost);
            break;
    }

    return sorted;
}

// Setup filter tabs
function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            currentFilter = tab.dataset.filter;
            displayRecommendations();
        });
    });
}

// Setup sort select
function setupSortSelect() {
    const sortSelect = document.getElementById('sortSelect');

    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        displayRecommendations();
    });
}
