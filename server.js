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
        const [cpu, mem, disk, network, temp, currentLoad, fsSize, osInfo] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.fsSize(),
            si.networkStats(),
            si.cpuTemperature(),
            si.currentLoad(),
            si.fsSize(),
            si.osInfo()
        ]);

        const timestamp = new Date().toLocaleTimeString();

        // CPU data
        const cpuUsage = currentLoad.currentLoad.toFixed(2);

        // Memory data
        const memUsed = ((mem.used / mem.total) * 100).toFixed(2);
        const memTotal = (mem.total / (1024 ** 3)).toFixed(2); // GB
        const memUsedGB = (mem.used / (1024 ** 3)).toFixed(2);

        // Disk data
        let diskUsed = 0;
        let diskTotal = 0;
        if (disk && disk.length > 0) {
            diskTotal = disk.reduce((sum, d) => sum + d.size, 0);
            diskUsed = disk.reduce((sum, d) => sum + d.used, 0);
        }
        const diskUsedPercent = diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(2) : 0;
        const diskUsedGB = (diskUsed / (1024 ** 3)).toFixed(2);
        const diskTotalGB = (diskTotal / (1024 ** 3)).toFixed(2);

        // Network data
        let networkRx = 0;
        let networkTx = 0;
        if (network && network.length > 0) {
            networkRx = network.reduce((sum, n) => sum + n.rx_sec, 0);
            networkTx = network.reduce((sum, n) => sum + n.tx_sec, 0);
        }
        const networkRxMB = (networkRx / (1024 ** 2)).toFixed(2);
        const networkTxMB = (networkTx / (1024 ** 2)).toFixed(2);

        // Temperature data
        const cpuTemp = temp.main || temp.cores?.[0] || 0;
        const gpuTemp = temp.gpu || 0;

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
                cores: cpu.cores,
                model: cpu.manufacturer + ' ' + cpu.brand,
                speed: cpu.speed + ' GHz'
            },
            memory: {
                used: memUsed,
                usedGB: memUsedGB,
                totalGB: memTotal,
                available: ((mem.available / mem.total) * 100).toFixed(2)
            },
            disk: {
                used: diskUsedPercent,
                usedGB: diskUsedGB,
                totalGB: diskTotalGB,
                details: disk.map(d => ({
                    fs: d.fs,
                    type: d.type,
                    size: (d.size / (1024 ** 3)).toFixed(2) + ' GB',
                    used: (d.used / (1024 ** 3)).toFixed(2) + ' GB',
                    use: d.use.toFixed(2) + '%'
                }))
            },
            network: {
                rxMB: networkRxMB,
                txMB: networkTxMB,
                interfaces: network.map(n => ({
                    iface: n.iface,
                    rx_sec: (n.rx_sec / 1024).toFixed(2) + ' KB/s',
                    tx_sec: (n.tx_sec / 1024).toFixed(2) + ' KB/s'
                }))
            },
            temperature: {
                cpu: cpuTemp,
                gpu: gpuTemp
            },
            system: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                arch: osInfo.arch,
                hostname: osInfo.hostname
            }
        };

        res.json(data);
    } catch (error) {
        console.error('Error fetching system resources:', error);
        res.status(500).json({ error: 'Failed to fetch system resources' });
    }
});

// Endpoint to get historical data
app.get('/api/history', (req, res) => {
    res.json(historyData);
});

app.listen(PORT, () => {
    console.log(`System Resource Monitor running at http://localhost:${PORT}`);
    console.log(`Monitoring started at ${new Date().toLocaleString()}`);
});
