// Global variables
let cpuChart, memoryChart, networkChart, tempChart;
let startTime = Date.now();
let updateInterval;
let stats = {
    cpu: { max: 0, min: 100, avg: 0, sum: 0, count: 0 },
    memory: { max: 0, min: 100, avg: 0, sum: 0, count: 0 },
    disk: { max: 0, min: 100, avg: 0, sum: 0, count: 0 },
    network: { maxRx: 0, maxTx: 0, totalRx: 0, totalTx: 0 },
    temperature: { maxCpu: 0, maxGpu: 0 }
};

// HTML escape function to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize charts
function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
            duration: 750
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: {
                display: true,
                ticks: {
                    maxTicksLimit: 10
                }
            },
            y: {
                beginAtZero: true
            }
        }
    };

    // CPU Chart
    const cpuCtx = document.getElementById('cpu-chart').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU 사용률 (%)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Memory Chart
    const memoryCtx = document.getElementById('memory-chart').getContext('2d');
    memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '메모리 사용률 (%)',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Network Chart
    const networkCtx = document.getElementById('network-chart').getContext('2d');
    networkChart = new Chart(networkCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '다운로드 (MB/s)',
                    data: [],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '업로드 (MB/s)',
                    data: [],
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: commonOptions
    });

    // Temperature Chart
    const tempCtx = document.getElementById('temp-chart').getContext('2d');
    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU 온도 (°C)',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'GPU 온도 (°C)',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: commonOptions
    });
}

// Update timer
function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('elapsed-time').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update statistics
function updateStats(data) {
    const cpu = parseFloat(data.cpu.usage);
    const memory = parseFloat(data.memory.used);
    const disk = parseFloat(data.disk.used);

    // CPU stats
    stats.cpu.max = Math.max(stats.cpu.max, cpu);
    stats.cpu.min = Math.min(stats.cpu.min, cpu);
    stats.cpu.sum += cpu;
    stats.cpu.count++;
    stats.cpu.avg = stats.cpu.sum / stats.cpu.count;

    // Memory stats
    stats.memory.max = Math.max(stats.memory.max, memory);
    stats.memory.min = Math.min(stats.memory.min, memory);
    stats.memory.sum += memory;
    stats.memory.count++;
    stats.memory.avg = stats.memory.sum / stats.memory.count;

    // Disk stats
    stats.disk.max = Math.max(stats.disk.max, disk);
    stats.disk.min = Math.min(stats.disk.min, disk);
    stats.disk.sum += disk;
    stats.disk.count++;
    stats.disk.avg = stats.disk.sum / stats.disk.count;

    // Network stats
    const rxMB = parseFloat(data.network.rxMB);
    const txMB = parseFloat(data.network.txMB);
    stats.network.maxRx = Math.max(stats.network.maxRx, rxMB);
    stats.network.maxTx = Math.max(stats.network.maxTx, txMB);
    stats.network.totalRx += rxMB;
    stats.network.totalTx += txMB;

    // Temperature stats
    stats.temperature.maxCpu = Math.max(stats.temperature.maxCpu, data.temperature.cpu);
    stats.temperature.maxGpu = Math.max(stats.temperature.maxGpu, data.temperature.gpu);

    // Update summary display
    updateSummary();
}

// Update summary display
function updateSummary() {
    const summaryHTML = `
        <div class="summary-item">
            <div class="summary-label">평균 CPU 사용률</div>
            <div class="summary-value">${stats.cpu.avg.toFixed(2)}%</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">최대 CPU 사용률</div>
            <div class="summary-value">${stats.cpu.max.toFixed(2)}%</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">평균 메모리 사용률</div>
            <div class="summary-value">${stats.memory.avg.toFixed(2)}%</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">최대 메모리 사용률</div>
            <div class="summary-value">${stats.memory.max.toFixed(2)}%</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">최대 다운로드 속도</div>
            <div class="summary-value">${stats.network.maxRx.toFixed(2)} MB/s</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">최대 업로드 속도</div>
            <div class="summary-value">${stats.network.maxTx.toFixed(2)} MB/s</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">최대 CPU 온도</div>
            <div class="summary-value">${stats.temperature.maxCpu.toFixed(1)}°C</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">최대 GPU 온도</div>
            <div class="summary-value">${stats.temperature.maxGpu.toFixed(1)}°C</div>
        </div>
    `;
    document.getElementById('summary-stats').innerHTML = summaryHTML;
}

// Fetch and update system resources
async function fetchResources() {
    try {
        const response = await fetch('http://localhost:3000/api/resources');
        const data = await response.json();

        // Update timer
        updateTimer();

        // Update stats
        updateStats(data);

        // Update last update time
        document.getElementById('last-update').textContent = data.timestamp;

        // Update system info - using textContent to prevent XSS
        document.getElementById('system-info').textContent =
            `${data.system.platform} | ${data.system.distro} | ${data.system.arch}`;

        // Update CPU card
        document.getElementById('cpu-value').textContent = data.cpu.usage + '%';
        document.getElementById('cpu-details').textContent =
            `${data.cpu.model} | ${data.cpu.cores} 코어 | ${data.cpu.speed}`;
        document.getElementById('cpu-bar').style.width = data.cpu.usage + '%';

        // Update Memory card
        document.getElementById('memory-value').textContent = data.memory.used + '%';
        document.getElementById('memory-details').textContent =
            `${data.memory.usedGB} GB / ${data.memory.totalGB} GB 사용 중`;
        document.getElementById('memory-bar').style.width = data.memory.used + '%';

        // Update Disk card
        document.getElementById('disk-value').textContent = data.disk.used + '%';
        document.getElementById('disk-details').textContent =
            `${data.disk.usedGB} GB / ${data.disk.totalGB} GB 사용 중`;
        document.getElementById('disk-bar').style.width = data.disk.used + '%';

        // Update Network card
        document.getElementById('network-value').innerHTML = `
            <div class="network-stats">
                <span class="download">⬇️ ${data.network.rxMB} MB/s</span>
                <span class="upload">⬆️ ${data.network.txMB} MB/s</span>
            </div>
        `;

        // Update Temperature card
        document.getElementById('temp-value').innerHTML = `
            <div class="temp-stats">
                <span class="cpu-temp">CPU: ${data.temperature.cpu.toFixed(1)}°C</span>
                <span class="gpu-temp">GPU: ${data.temperature.gpu.toFixed(1)}°C</span>
            </div>
        `;

        // Update disk table - with HTML escaping to prevent XSS
        const diskTableBody = document.getElementById('disk-table-body');
        diskTableBody.innerHTML = data.disk.details.map(disk => `
            <tr>
                <td>${escapeHtml(disk.fs)}</td>
                <td>${escapeHtml(disk.type)}</td>
                <td>${escapeHtml(disk.size)}</td>
                <td>${escapeHtml(disk.used)}</td>
                <td>${escapeHtml(disk.use)}</td>
            </tr>
        `).join('');

        // Update network table - with HTML escaping to prevent XSS
        const networkTableBody = document.getElementById('network-table-body');
        networkTableBody.innerHTML = data.network.interfaces.map(iface => `
            <tr>
                <td>${escapeHtml(iface.iface)}</td>
                <td>${escapeHtml(iface.rx_sec)}</td>
                <td>${escapeHtml(iface.tx_sec)}</td>
            </tr>
        `).join('');

        // Update charts
        updateCharts(data);

    } catch (error) {
        console.error('Error fetching resources:', error);
        // Show user-friendly error message
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) {
            lastUpdate.textContent = 'Connection error';
            lastUpdate.style.color = '#ef4444';
        }
    }
}

// Update charts with new data
function updateCharts(data) {
    const maxDataPoints = 60; // Show last 60 data points

    // Update CPU chart
    cpuChart.data.labels.push(data.timestamp);
    cpuChart.data.datasets[0].data.push(parseFloat(data.cpu.usage));
    if (cpuChart.data.labels.length > maxDataPoints) {
        cpuChart.data.labels.shift();
        cpuChart.data.datasets[0].data.shift();
    }
    cpuChart.update('none');

    // Update Memory chart
    memoryChart.data.labels.push(data.timestamp);
    memoryChart.data.datasets[0].data.push(parseFloat(data.memory.used));
    if (memoryChart.data.labels.length > maxDataPoints) {
        memoryChart.data.labels.shift();
        memoryChart.data.datasets[0].data.shift();
    }
    memoryChart.update('none');

    // Update Network chart
    networkChart.data.labels.push(data.timestamp);
    networkChart.data.datasets[0].data.push(parseFloat(data.network.rxMB));
    networkChart.data.datasets[1].data.push(parseFloat(data.network.txMB));
    if (networkChart.data.labels.length > maxDataPoints) {
        networkChart.data.labels.shift();
        networkChart.data.datasets[0].data.shift();
        networkChart.data.datasets[1].data.shift();
    }
    networkChart.update('none');

    // Update Temperature chart
    tempChart.data.labels.push(data.timestamp);
    tempChart.data.datasets[0].data.push(data.temperature.cpu);
    tempChart.data.datasets[1].data.push(data.temperature.gpu);
    if (tempChart.data.labels.length > maxDataPoints) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
        tempChart.data.datasets[1].data.shift();
    }
    tempChart.update('none');
}

// Export to PDF
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const button = document.getElementById('export-pdf');
    button.textContent = 'PDF 생성 중...';
    button.disabled = true;

    try {
        const content = document.getElementById('content');
        const canvas = await html2canvas(content, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const imgData = canvas.toDataURL('image/png');

        // Add title page
        pdf.setFontSize(20);
        pdf.text('시스템 리소스 모니터링 보고서', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`생성 일시: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        pdf.text(`모니터링 시간: ${minutes}분 ${seconds}초`, 105, 40, { align: 'center' });

        // Add first page of content
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.height;

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.height;
        }

        // Save PDF
        const fileName = `system-monitor-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
        pdf.save(fileName);

        button.textContent = '📄 PDF로 내보내기';
        button.disabled = false;

        alert(`PDF가 성공적으로 생성되었습니다: ${fileName}`);
    } catch (error) {
        console.error('PDF 생성 오류:', error);
        button.textContent = '📄 PDF로 내보내기';
        button.disabled = false;
        alert('PDF 생성 중 오류가 발생했습니다.');
    }
}

// Initialize application
function init() {
    initCharts();
    fetchResources();

    // Update every second
    updateInterval = setInterval(fetchResources, 1000);

    // Add export button listener
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
}

// Start when page loads
window.addEventListener('load', init);
