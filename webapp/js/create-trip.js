// Create Trip Page JavaScript

let currentStep = 1;
const totalSteps = 4;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    setupDateListeners();
    setupFormSubmit();
});

// Navigate to next step
function nextStep(step) {
    if (validateCurrentStep()) {
        currentStep = step;
        updateStepDisplay();
        updateProgressBar();
    }
}

// Navigate to previous step
function prevStep(step) {
    currentStep = step;
    updateStepDisplay();
    updateProgressBar();
}

// Update step display
function updateStepDisplay() {
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section, index) => {
        if (parseInt(section.dataset.step) === currentStep) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update progress bar
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const percentage = (currentStep / totalSteps) * 100;
    progressBar.style.width = `${percentage}%`;
}

// Validate current step
function validateCurrentStep() {
    const currentSection = document.querySelector(`.form-section[data-step="${currentStep}"]`);
    const inputs = currentSection.querySelectorAll('input[required], select[required]');

    for (const input of inputs) {
        if (!input.value) {
            utils.showToast(`${input.labels[0]?.textContent || '필수 항목'}을(를) 입력해주세요.`, 'error');
            input.focus();
            return false;
        }
    }

    return true;
}

// Setup date listeners
function setupDateListeners() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const tripDuration = document.getElementById('tripDuration');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    startDate.min = today;
    endDate.min = today;

    // Update duration when dates change
    const updateDuration = () => {
        if (startDate.value && endDate.value) {
            const days = utils.daysBetween(startDate.value, endDate.value);
            if (days >= 0) {
                tripDuration.textContent = `여행 기간: ${days + 1}일`;
            } else {
                tripDuration.textContent = '여행 기간: 종료일을 다시 선택해주세요';
            }
        }
    };

    startDate.addEventListener('change', () => {
        endDate.min = startDate.value;
        updateDuration();
    });

    endDate.addEventListener('change', updateDuration);
}

// Setup form submit
function setupFormSubmit() {
    const form = document.getElementById('createTripForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateCurrentStep()) {
            return;
        }

        await createTrip();
    });
}

// Create trip
async function createTrip() {
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Collect form data
    const title = document.getElementById('tripTitle').value;
    const travelers = parseInt(document.getElementById('travelers').value);
    const budget = parseFloat(document.getElementById('budget').value);
    const originAddress = document.getElementById('origin').value;
    const destinationAddress = document.getElementById('destination').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    const travelStyle = document.querySelector('input[name="travelStyle"]:checked')?.value || 'balanced';
    const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
        .map(cb => cb.value);
    const transportation = Array.from(document.querySelectorAll('input[name="transportation"]:checked'))
        .map(cb => cb.value);

    try {
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 여행 만드는 중...';
        errorMessage.style.display = 'none';

        // Geocode addresses
        utils.showToast('주소를 검색하는 중...', 'info');
        const origin = await api.geocodeAddress(originAddress);
        const destination = await api.geocodeAddress(destinationAddress);

        // Create trip
        utils.showToast('여행을 생성하는 중...', 'info');
        const trip = await api.createTrip({
            title,
            travelers_count: travelers,
            budget,
            budget_currency: 'KRW',
            origin,
            destination,
            start_date: startDate,
            end_date: endDate
        });

        utils.showToast('여행이 성공적으로 생성되었습니다!', 'success');

        // Redirect to trip detail page
        setTimeout(() => {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_TRIP, trip.id);
            window.location.href = `trip-map.html?id=${trip.id}`;
        }, 1000);

    } catch (error) {
        console.error('Error creating trip:', error);
        errorMessage.textContent = error.message || '여행 생성에 실패했습니다.';
        errorMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> 여행 만들기';
        utils.showToast('여행 생성에 실패했습니다.', 'error');
    }
}
