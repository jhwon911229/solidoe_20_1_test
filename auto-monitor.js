const http = require('http');
const fs = require('fs');

const MONITORING_DURATION = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL = 1000; // 1 second
const collectedData = [];
const stats = {
    cpu: { max: 0, min: 100, sum: 0, count: 0 },
    memory: { max: 0, min: 100, sum: 0, count: 0 },
    disk: { max: 0, min: 100, sum: 0, count: 0 },
    network: { maxRx: 0, maxTx: 0, totalRx: 0, totalTx: 0 },
    temperature: { maxCpu: 0, maxGpu: 0 }
};

function fetchData() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/resources', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function updateStats(data) {
    const cpu = parseFloat(data.cpu.usage);
    const memory = parseFloat(data.memory.used);
    const disk = parseFloat(data.disk.used);
    const rxMB = parseFloat(data.network.rxMB);
    const txMB = parseFloat(data.network.txMB);

    stats.cpu.max = Math.max(stats.cpu.max, cpu);
    stats.cpu.min = Math.min(stats.cpu.min, cpu);
    stats.cpu.sum += cpu;
    stats.cpu.count++;

    stats.memory.max = Math.max(stats.memory.max, memory);
    stats.memory.min = Math.min(stats.memory.min, memory);
    stats.memory.sum += memory;
    stats.memory.count++;

    stats.disk.max = Math.max(stats.disk.max, disk);
    stats.disk.min = Math.min(stats.disk.min, disk);
    stats.disk.sum += disk;
    stats.disk.count++;

    stats.network.maxRx = Math.max(stats.network.maxRx, rxMB);
    stats.network.maxTx = Math.max(stats.network.maxTx, txMB);
    stats.network.totalRx += rxMB;
    stats.network.totalTx += txMB;

    stats.temperature.maxCpu = Math.max(stats.temperature.maxCpu, data.temperature.cpu);
    stats.temperature.maxGpu = Math.max(stats.temperature.maxGpu, data.temperature.gpu);
}

function generateHTMLReport() {
    const cpuAvg = (stats.cpu.sum / stats.cpu.count).toFixed(2);
    const memAvg = (stats.memory.sum / stats.memory.count).toFixed(2);
    const diskAvg = (stats.disk.sum / stats.disk.count).toFixed(2);

    // Prepare chart data
    const timestamps = collectedData.map(d => d.timestamp);
    const cpuData = collectedData.map(d => parseFloat(d.cpu.usage));
    const memoryData = collectedData.map(d => parseFloat(d.memory.used));
    const networkRxData = collectedData.map(d => parseFloat(d.network.rxMB));
    const networkTxData = collectedData.map(d => parseFloat(d.network.txMB));
    const tempCpuData = collectedData.map(d => d.temperature.cpu);
    const tempGpuData = collectedData.map(d => d.temperature.gpu);

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>시스템 모니터링 보고서</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .meta-info {
            color: #666;
            font-size: 1.1em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #f9fafb;
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #667eea;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .stat-card h3 {
            color: #555;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .stat-detail {
            color: #666;
            font-size: 0.9em;
        }
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        .chart-container {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .chart-container h3 {
            margin-bottom: 20px;
            color: #555;
        }
        canvas {
            max-height: 300px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 40px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        th, td {
            padding: 15px;
            text-align: left;
        }
        tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🖥️ 시스템 리소스 모니터링 보고서</h1>
            <div class="meta-info">
                <p>생성 일시: ${new Date().toLocaleString('ko-KR')}</p>
                <p>모니터링 기간: 5분 (${collectedData.length}개 데이터 포인트)</p>
            </div>
        </header>

        <h2 style="margin-bottom: 20px; color: #667eea;">📊 통계 요약</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>평균 CPU 사용률</h3>
                <div class="stat-value">${cpuAvg}%</div>
                <div class="stat-detail">최대: ${stats.cpu.max.toFixed(2)}% | 최소: ${stats.cpu.min.toFixed(2)}%</div>
            </div>
            <div class="stat-card">
                <h3>평균 메모리 사용률</h3>
                <div class="stat-value">${memAvg}%</div>
                <div class="stat-detail">최대: ${stats.memory.max.toFixed(2)}% | 최소: ${stats.memory.min.toFixed(2)}%</div>
            </div>
            <div class="stat-card">
                <h3>평균 디스크 사용률</h3>
                <div class="stat-value">${diskAvg}%</div>
                <div class="stat-detail">최대: ${stats.disk.max.toFixed(2)}% | 최소: ${stats.disk.min.toFixed(2)}%</div>
            </div>
            <div class="stat-card">
                <h3>최대 네트워크 속도</h3>
                <div class="stat-value">${stats.network.maxRx.toFixed(2)} MB/s</div>
                <div class="stat-detail">다운로드 최대 | 업로드 최대: ${stats.network.maxTx.toFixed(2)} MB/s</div>
            </div>
            <div class="stat-card">
                <h3>최대 CPU 온도</h3>
                <div class="stat-value">${stats.temperature.maxCpu.toFixed(1)}°C</div>
                <div class="stat-detail">GPU 최대: ${stats.temperature.maxGpu.toFixed(1)}°C</div>
            </div>
        </div>

        <h2 style="margin-bottom: 20px; color: #667eea;">📈 시각화</h2>
        <div class="charts-section">
            <div class="chart-container">
                <h3>CPU 사용률 추이</h3>
                <canvas id="cpu-chart"></canvas>
            </div>
            <div class="chart-container">
                <h3>메모리 사용률 추이</h3>
                <canvas id="memory-chart"></canvas>
            </div>
            <div class="chart-container">
                <h3>네트워크 트래픽</h3>
                <canvas id="network-chart"></canvas>
            </div>
            <div class="chart-container">
                <h3>온도 모니터링</h3>
                <canvas id="temp-chart"></canvas>
            </div>
        </div>

        <h2 style="margin-top: 40px; margin-bottom: 20px; color: #667eea;">📋 시스템 정보</h2>
        <table>
            <thead>
                <tr>
                    <th>항목</th>
                    <th>정보</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>플랫폼</strong></td>
                    <td>${collectedData[0]?.system.platform || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>배포판</strong></td>
                    <td>${collectedData[0]?.system.distro || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>아키텍처</strong></td>
                    <td>${collectedData[0]?.system.arch || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>CPU</strong></td>
                    <td>${collectedData[0]?.cpu.model || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>CPU 코어</strong></td>
                    <td>${collectedData[0]?.cpu.cores || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>총 메모리</strong></td>
                    <td>${collectedData[0]?.memory.totalGB || 'N/A'} GB</td>
                </tr>
                <tr>
                    <td><strong>총 디스크</strong></td>
                    <td>${collectedData[0]?.disk.totalGB || 'N/A'} GB</td>
                </tr>
            </tbody>
        </table>

        <footer>
            <p>이 보고서는 시스템 리소스 모니터에 의해 자동으로 생성되었습니다.</p>
            <p style="margin-top: 10px; font-size: 0.9em;">브라우저에서 인쇄(Ctrl+P)를 사용하여 PDF로 저장할 수 있습니다.</p>
        </footer>
    </div>

    <script>
        const timestamps = ${JSON.stringify(timestamps)};
        const cpuData = ${JSON.stringify(cpuData)};
        const memoryData = ${JSON.stringify(memoryData)};
        const networkRxData = ${JSON.stringify(networkRxData)};
        const networkTxData = ${JSON.stringify(networkTxData)};
        const tempCpuData = ${JSON.stringify(tempCpuData)};
        const tempGpuData = ${JSON.stringify(tempGpuData)};

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        };

        // CPU Chart
        new Chart(document.getElementById('cpu-chart'), {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'CPU 사용률 (%)',
                    data: cpuData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { ...commonOptions, scales: { y: { beginAtZero: true, max: 100 } } }
        });

        // Memory Chart
        new Chart(document.getElementById('memory-chart'), {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: '메모리 사용률 (%)',
                    data: memoryData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { ...commonOptions, scales: { y: { beginAtZero: true, max: 100 } } }
        });

        // Network Chart
        new Chart(document.getElementById('network-chart'), {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [
                    {
                        label: '다운로드 (MB/s)',
                        data: networkRxData,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '업로드 (MB/s)',
                        data: networkTxData,
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
        new Chart(document.getElementById('temp-chart'), {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [
                    {
                        label: 'CPU 온도 (°C)',
                        data: tempCpuData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'GPU 온도 (°C)',
                        data: tempGpuData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: commonOptions
        });
    </script>
</body>
</html>`;

    return html;
}

async function runMonitoring() {
    console.log('=================================');
    console.log('시스템 리소스 모니터링 시작');
    console.log('=================================');
    console.log(`모니터링 기간: 5분`);
    console.log(`데이터 수집 간격: 1초`);
    console.log('');

    const startTime = Date.now();
    let lastProgressUpdate = 0;

    const intervalId = setInterval(async () => {
        try {
            const data = await fetchData();
            collectedData.push(data);
            updateStats(data);

            const elapsed = Date.now() - startTime;
            const elapsedSeconds = Math.floor(elapsed / 1000);
            const remaining = Math.floor((MONITORING_DURATION - elapsed) / 1000);

            // Show progress every 10 seconds
            if (elapsedSeconds - lastProgressUpdate >= 10) {
                console.log(`[${elapsedSeconds}초] 데이터 수집 중... (남은 시간: ${remaining}초)`);
                console.log(`  CPU: ${data.cpu.usage}% | 메모리: ${data.memory.used}% | 온도: ${data.temperature.cpu.toFixed(1)}°C`);
                lastProgressUpdate = elapsedSeconds;
            }

            if (elapsed >= MONITORING_DURATION) {
                clearInterval(intervalId);
                console.log('');
                console.log('=================================');
                console.log('모니터링 완료!');
                console.log('=================================');
                console.log(`총 수집된 데이터 포인트: ${collectedData.length}개`);
                console.log('');
                console.log('📊 통계 요약:');
                console.log(`  평균 CPU 사용률: ${(stats.cpu.sum / stats.cpu.count).toFixed(2)}%`);
                console.log(`  최대 CPU 사용률: ${stats.cpu.max.toFixed(2)}%`);
                console.log(`  평균 메모리 사용률: ${(stats.memory.sum / stats.memory.count).toFixed(2)}%`);
                console.log(`  최대 메모리 사용률: ${stats.memory.max.toFixed(2)}%`);
                console.log(`  최대 네트워크 다운로드: ${stats.network.maxRx.toFixed(2)} MB/s`);
                console.log(`  최대 네트워크 업로드: ${stats.network.maxTx.toFixed(2)} MB/s`);
                console.log(`  최대 CPU 온도: ${stats.temperature.maxCpu.toFixed(1)}°C`);
                console.log(`  최대 GPU 온도: ${stats.temperature.maxGpu.toFixed(1)}°C`);
                console.log('');

                // Generate HTML report
                const htmlReport = generateHTMLReport();
                const reportFilename = `monitoring-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
                fs.writeFileSync(reportFilename, htmlReport);

                console.log(`✅ HTML 보고서 생성 완료: ${reportFilename}`);
                console.log('');
                console.log('📌 다음 단계:');
                console.log(`   1. 브라우저에서 ${reportFilename} 파일을 엽니다`);
                console.log('   2. Ctrl+P (또는 Cmd+P)를 눌러 인쇄 대화상자를 엽니다');
                console.log('   3. "PDF로 저장"을 선택하여 PDF 파일을 생성합니다');
                console.log('');

                process.exit(0);
            }
        } catch (error) {
            console.error('데이터 수집 오류:', error.message);
        }
    }, POLL_INTERVAL);
}

console.log('서버 연결 대기 중...');
setTimeout(() => {
    runMonitoring().catch(error => {
        console.error('모니터링 오류:', error);
        process.exit(1);
    });
}, 2000);
