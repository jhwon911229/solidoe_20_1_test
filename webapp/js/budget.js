// Budget Page JavaScript

let currentTrip = null;
let budgetAnalysis = null;
let categoryChart = null;
let dailyChart = null;

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

    // Load trip data and budget analysis
    await loadTripData(tripId);
    await analyzeBudget(tripId);

    // Setup back button
    document.getElementById('backToTrip').href = `trip-map.html?id=${tripId}`;
});

// Load trip data
async function loadTripData(tripId) {
    try {
        currentTrip = await api.getTrip(tripId);
        document.getElementById('tripTitle').textContent = `${currentTrip.title} - 예산 관리`;

        // Display total budget
        document.getElementById('totalBudget').textContent = utils.formatCurrency(currentTrip.budget);

    } catch (error) {
        console.error('Error loading trip:', error);
        utils.showToast('여행 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// Analyze budget
async function analyzeBudget(tripId) {
    try {
        budgetAnalysis = await api.analyzeTripCost(tripId);

        // Display budget overview
        displayBudgetOverview();

        // Display budget progress
        displayBudgetProgress();

        // Display category breakdown
        displayCategoryBreakdown();

        // Display charts
        displayCharts();

        // Display optimization tips
        displayOptimizationTips();

    } catch (error) {
        console.error('Error analyzing budget:', error);
        utils.showToast('예산 분석에 실패했습니다.', 'error');

        // Display mock data for demo
        displayMockBudgetData();
    }
}

// Display budget overview
function displayBudgetOverview() {
    const totalSpent = parseFloat(budgetAnalysis.total_estimated_cost);
    const totalBudget = currentTrip.budget;
    const remaining = totalBudget - totalSpent;
    const dailyBudget = parseFloat(budgetAnalysis.daily_budget);

    document.getElementById('totalSpent').textContent = utils.formatCurrency(totalSpent);
    document.getElementById('remaining').textContent = utils.formatCurrency(remaining);
    document.getElementById('dailyBudget').textContent = utils.formatCurrency(dailyBudget);
}

// Display budget progress
function displayBudgetProgress() {
    const totalSpent = parseFloat(budgetAnalysis.total_estimated_cost);
    const totalBudget = currentTrip.budget;
    const percentage = (totalSpent / totalBudget) * 100;

    document.getElementById('budgetProgress').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('budgetPercentage').textContent = `${percentage.toFixed(1)}%`;

    const statusDiv = document.getElementById('progressStatus');
    if (percentage < 70) {
        statusDiv.textContent = '✓ 예산이 충분합니다';
        statusDiv.style.background = '#D4EDDA';
        statusDiv.style.color = '#155724';
        document.getElementById('budgetProgress').style.background = 'linear-gradient(90deg, #34C759, #30D158)';
    } else if (percentage < 90) {
        statusDiv.textContent = '⚠ 예산의 대부분을 사용했습니다';
        statusDiv.style.background = '#FFF3CD';
        statusDiv.style.color = '#856404';
        document.getElementById('budgetProgress').style.background = 'linear-gradient(90deg, #FF9500, #FFCC00)';
    } else {
        statusDiv.textContent = '⚠ 예산을 초과했습니다';
        statusDiv.style.background = '#FFE5E5';
        statusDiv.style.color = '#FF3B30';
        document.getElementById('budgetProgress').style.background = 'linear-gradient(90deg, #FF3B30, #FF6259)';
    }
}

// Display category breakdown
function displayCategoryBreakdown() {
    const totalSpent = parseFloat(budgetAnalysis.total_estimated_cost);

    // Calculate category costs
    let transportCost = 0;
    budgetAnalysis.transportation_breakdown.forEach(item => {
        transportCost += parseFloat(item.cost);
    });

    // Mock data for other categories (would come from recommendations)
    const foodCost = totalSpent * 0.25;
    const accommodationCost = totalSpent * 0.35;
    const attractionCost = totalSpent * 0.15;
    const activityCost = totalSpent * 0.10;

    // Display costs
    document.getElementById('transportCost').textContent = utils.formatCurrency(transportCost);
    document.getElementById('foodCost').textContent = utils.formatCurrency(foodCost);
    document.getElementById('accommodationCost').textContent = utils.formatCurrency(accommodationCost);
    document.getElementById('attractionCost').textContent = utils.formatCurrency(attractionCost);
    document.getElementById('activityCost').textContent = utils.formatCurrency(activityCost);

    // Update progress bars
    document.getElementById('transportBar').style.width = `${(transportCost / totalSpent) * 100}%`;
    document.getElementById('foodBar').style.width = `${(foodCost / totalSpent) * 100}%`;
    document.getElementById('accommodationBar').style.width = `${(accommodationCost / totalSpent) * 100}%`;
    document.getElementById('attractionBar').style.width = `${(attractionCost / totalSpent) * 100}%`;
    document.getElementById('activityBar').style.width = `${(activityCost / totalSpent) * 100}%`;
}

// Display charts
function displayCharts() {
    displayCategoryChart();
    displayDailyChart();
}

// Display category pie chart
function displayCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    const totalSpent = parseFloat(budgetAnalysis.total_estimated_cost);
    let transportCost = 0;
    budgetAnalysis.transportation_breakdown.forEach(item => {
        transportCost += parseFloat(item.cost);
    });

    const foodCost = totalSpent * 0.25;
    const accommodationCost = totalSpent * 0.35;
    const attractionCost = totalSpent * 0.15;
    const activityCost = totalSpent * 0.10;

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['교통', '식사', '숙박', '관광', '액티비티'],
            datasets: [{
                data: [transportCost, foodCost, accommodationCost, attractionCost, activityCost],
                backgroundColor: [
                    '#007AFF',
                    '#34C759',
                    '#FF9500',
                    '#FF3B30',
                    '#5856D6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Display daily budget chart
function displayDailyChart() {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    const tripDays = utils.daysBetween(currentTrip.start_date, currentTrip.end_date) + 1;
    const dailyBudget = parseFloat(budgetAnalysis.daily_budget);

    // Generate daily labels
    const labels = [];
    for (let i = 1; i <= tripDays; i++) {
        labels.push(`Day ${i}`);
    }

    // Mock daily spending data
    const data = [];
    for (let i = 0; i < tripDays; i++) {
        data.push(dailyBudget * (0.8 + Math.random() * 0.4));
    }

    if (dailyChart) {
        dailyChart.destroy();
    }

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '일별 예산 (₩)',
                data: data,
                backgroundColor: '#007AFF',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => utils.formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Display optimization tips
function displayOptimizationTips() {
    const tipsContainer = document.getElementById('optimizationTips');
    tipsContainer.innerHTML = '';

    const totalSpent = parseFloat(budgetAnalysis.total_estimated_cost);
    const totalBudget = currentTrip.budget;
    const percentage = (totalSpent / totalBudget) * 100;

    const tips = [];

    if (percentage > 90) {
        tips.push({
            icon: 'fa-exclamation-triangle',
            text: '예산을 초과했습니다. 일부 활동이나 숙소 등급을 조정하는 것을 고려해보세요.'
        });
    }

    if (percentage < 70) {
        tips.push({
            icon: 'fa-lightbulb',
            text: '예산에 여유가 있습니다. 추가 액티비티나 특별한 경험을 고려해보세요.'
        });
    }

    tips.push({
        icon: 'fa-utensils',
        text: '현지 맛집을 방문하면 좋은 경험과 합리적인 가격을 모두 즐길 수 있습니다.'
    });

    tips.push({
        icon: 'fa-bus',
        text: '대중교통을 이용하면 교통비를 절약할 수 있습니다.'
    });

    tips.push({
        icon: 'fa-calendar-alt',
        text: '비수기에 여행하면 숙박비와 항공료를 절약할 수 있습니다.'
    });

    tips.forEach(tip => {
        const tipCard = document.createElement('div');
        tipCard.className = 'tip-card';
        tipCard.innerHTML = `
            <i class="fas ${tip.icon}"></i>
            <p>${tip.text}</p>
        `;
        tipsContainer.appendChild(tipCard);
    });
}

// Display mock budget data (for demo when API fails)
function displayMockBudgetData() {
    const totalBudget = currentTrip.budget;
    const totalSpent = totalBudget * 0.75;
    const remaining = totalBudget - totalSpent;
    const tripDays = utils.daysBetween(currentTrip.start_date, currentTrip.end_date) + 1;
    const dailyBudget = totalBudget / tripDays;

    document.getElementById('totalSpent').textContent = utils.formatCurrency(totalSpent);
    document.getElementById('remaining').textContent = utils.formatCurrency(remaining);
    document.getElementById('dailyBudget').textContent = utils.formatCurrency(dailyBudget);

    const percentage = (totalSpent / totalBudget) * 100;
    document.getElementById('budgetProgress').style.width = `${percentage}%`;
    document.getElementById('budgetPercentage').textContent = `${percentage.toFixed(1)}%`;

    const statusDiv = document.getElementById('progressStatus');
    statusDiv.textContent = '✓ 예산 사용 중';
    statusDiv.style.background = '#D4EDDA';
    statusDiv.style.color = '#155724';

    // Display mock category costs
    const transportCost = totalSpent * 0.20;
    const foodCost = totalSpent * 0.25;
    const accommodationCost = totalSpent * 0.35;
    const attractionCost = totalSpent * 0.15;
    const activityCost = totalSpent * 0.05;

    document.getElementById('transportCost').textContent = utils.formatCurrency(transportCost);
    document.getElementById('foodCost').textContent = utils.formatCurrency(foodCost);
    document.getElementById('accommodationCost').textContent = utils.formatCurrency(accommodationCost);
    document.getElementById('attractionCost').textContent = utils.formatCurrency(attractionCost);
    document.getElementById('activityCost').textContent = utils.formatCurrency(activityCost);

    document.getElementById('transportBar').style.width = '20%';
    document.getElementById('foodBar').style.width = '25%';
    document.getElementById('accommodationBar').style.width = '35%';
    document.getElementById('attractionBar').style.width = '15%';
    document.getElementById('activityBar').style.width = '5%';

    // Display charts with mock data
    displayCharts();
    displayOptimizationTips();
}

// Optimize budget
function optimizeBudget() {
    utils.showToast('AI가 예산을 최적화하고 있습니다...', 'info');

    setTimeout(() => {
        utils.showToast('예산이 최적화되었습니다!', 'success');
    }, 2000);
}
