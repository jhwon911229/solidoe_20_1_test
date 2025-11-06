const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Store historical data
const historyData = {
    timestamps: [],
    cpu: [],
    memory: [],
    disk: [],
    network: { rx: [], tx: [] },
    temperatures: []
};

const maxDataPoints = 300; // 5 minutes at 1 second intervals

// Endpoint to get current system resources
app.get('/api/resources', async (req, res) => {
    try {
        const [cpu, mem, disk, network, temp, currentLoad, osInfo] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.fsSize(),
            si.networkStats(),
            si.cpuTemperature(),
            si.currentLoad(),
            si.osInfo()
        ]);

        const timestamp = new Date().toLocaleTimeString();

        // CPU data - with null/undefined check
        let cpuUsageValue = 0;
        if (currentLoad) {
            if (typeof currentLoad.currentLoad === 'number' && !isNaN(currentLoad.currentLoad)) {
                cpuUsageValue = currentLoad.currentLoad;
            } else if (typeof currentLoad.avgLoad === 'number' && !isNaN(currentLoad.avgLoad)) {
                cpuUsageValue = currentLoad.avgLoad;
            } else if (Array.isArray(currentLoad.cpus) && currentLoad.cpus.length > 0) {
                // Calculate average from individual CPU loads
                const totalLoad = currentLoad.cpus.reduce((sum, cpu) => sum + (cpu.load || 0), 0);
                cpuUsageValue = totalLoad / currentLoad.cpus.length;
            }
        }
        const cpuUsage = cpuUsageValue.toFixed(2);

        // Memory data - with safety checks
        const memTotal = mem && mem.total ? (mem.total / (1024 ** 3)).toFixed(2) : '0';
        const memUsed = mem && mem.used && mem.total
            ? ((mem.used / mem.total) * 100).toFixed(2)
            : '0';
        const memUsedGB = mem && mem.used ? (mem.used / (1024 ** 3)).toFixed(2) : '0';
        const memAvailable = mem && mem.available && mem.total
            ? ((mem.available / mem.total) * 100).toFixed(2)
            : '0';

        // Disk data - with safety checks
        let diskUsed = 0;
        let diskTotal = 0;
        if (disk && Array.isArray(disk) && disk.length > 0) {
            diskTotal = disk.reduce((sum, d) => sum + (d.size || 0), 0);
            diskUsed = disk.reduce((sum, d) => sum + (d.used || 0), 0);
        }
        const diskUsedPercent = diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(2) : '0';
        const diskUsedGB = (diskUsed / (1024 ** 3)).toFixed(2);
        const diskTotalGB = (diskTotal / (1024 ** 3)).toFixed(2);

        // Network data - with safety checks
        let networkRx = 0;
        let networkTx = 0;
        if (network && Array.isArray(network) && network.length > 0) {
            networkRx = network.reduce((sum, n) => sum + (n.rx_sec || 0), 0);
            networkTx = network.reduce((sum, n) => sum + (n.tx_sec || 0), 0);
        }
        const networkRxMB = (networkRx / (1024 ** 2)).toFixed(2);
        const networkTxMB = (networkTx / (1024 ** 2)).toFixed(2);

        // Temperature data - with safety checks
        const cpuTemp = (temp && (temp.main || (temp.cores && temp.cores[0]))) || 0;
        const gpuTemp = (temp && temp.gpu) || 0;

        // Store in history
        historyData.timestamps.push(timestamp);
        historyData.cpu.push(parseFloat(cpuUsage));
        historyData.memory.push(parseFloat(memUsed));
        historyData.disk.push(parseFloat(diskUsedPercent));
        historyData.network.rx.push(networkRx);
        historyData.network.tx.push(networkTx);
        historyData.temperatures.push({ cpu: cpuTemp, gpu: gpuTemp });

        // Keep only last maxDataPoints
        if (historyData.timestamps.length > maxDataPoints) {
            historyData.timestamps.shift();
            historyData.cpu.shift();
            historyData.memory.shift();
            historyData.disk.shift();
            historyData.network.rx.shift();
            historyData.network.tx.shift();
            historyData.temperatures.shift();
        }

        const data = {
            timestamp,
            cpu: {
                usage: cpuUsage,
                cores: cpu && cpu.cores ? cpu.cores : 'N/A',
                model: cpu ? `${cpu.manufacturer || 'Unknown'} ${cpu.brand || ''}`.trim() : 'Unknown CPU',
                speed: cpu && cpu.speed ? `${cpu.speed} GHz` : 'N/A'
            },
            memory: {
                used: memUsed,
                usedGB: memUsedGB,
                totalGB: memTotal,
                available: memAvailable
            },
            disk: {
                used: diskUsedPercent,
                usedGB: diskUsedGB,
                totalGB: diskTotalGB,
                details: (disk && Array.isArray(disk)) ? disk.map(d => ({
                    fs: d.fs || 'Unknown',
                    type: d.type || 'Unknown',
                    size: ((d.size || 0) / (1024 ** 3)).toFixed(2) + ' GB',
                    used: ((d.used || 0) / (1024 ** 3)).toFixed(2) + ' GB',
                    use: (d.use || 0).toFixed(2) + '%'
                })) : []
            },
            network: {
                rxMB: networkRxMB,
                txMB: networkTxMB,
                interfaces: (network && Array.isArray(network)) ? network.map(n => ({
                    iface: n.iface || 'Unknown',
                    rx_sec: ((n.rx_sec || 0) / 1024).toFixed(2) + ' KB/s',
                    tx_sec: ((n.tx_sec || 0) / 1024).toFixed(2) + ' KB/s'
                })) : []
            },
            temperature: {
                cpu: cpuTemp,
                gpu: gpuTemp
            },
            system: {
                platform: osInfo && osInfo.platform ? osInfo.platform : 'Unknown',
                distro: osInfo && osInfo.distro ? osInfo.distro : 'Unknown',
                arch: osInfo && osInfo.arch ? osInfo.arch : 'Unknown',
                hostname: osInfo && osInfo.hostname ? osInfo.hostname : 'Unknown'
            }
        };

        res.json(data);
    } catch (error) {
        console.error('Error fetching system resources:', error);
        res.status(500).json({
            error: 'Failed to fetch system resources',
            timestamp: new Date().toISOString(),
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Endpoint to get historical data
app.get('/api/history', (req, res) => {
    res.json(historyData);
});

// Endpoint to download standalone HTML file
app.get('/download', (req, res) => {
    const fs = require('fs');

    // Read all necessary files
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');
    const js = fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8');

    // Create standalone HTML with embedded CSS and JS
    const standaloneHTML = html
        .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
        .replace('<script src="app.js"></script>', `<script>${js}</script>`);

    // Set headers for download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="system-monitor-standalone.html"');
    res.send(standaloneHTML);
});

app.listen(PORT, () => {
    console.log(`System Resource Monitor running at http://localhost:${PORT}`);
    console.log(`Monitoring started at ${new Date().toLocaleString()}`);
    console.log(`Download standalone HTML: http://localhost:${PORT}/download`);
});
