const puppeteer = require('puppeteer');

const MONITORING_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function runMonitoring() {
    console.log('Starting automated monitoring...');
    console.log(`Duration: 5 minutes`);
    console.log('Opening browser...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to monitoring dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    console.log('Monitoring started. Waiting for 5 minutes...');
    const startTime = Date.now();

    // Show progress every 30 seconds
    const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.floor((MONITORING_DURATION - (Date.now() - startTime)) / 1000);
        console.log(`Progress: ${elapsed}s elapsed, ${remaining}s remaining...`);
    }, 30000);

    // Wait for 5 minutes
    await new Promise(resolve => setTimeout(resolve, MONITORING_DURATION));

    clearInterval(progressInterval);
    console.log('5 minutes completed. Generating PDF...');

    // Click the export button
    await page.click('#export-pdf');

    // Wait for PDF generation
    console.log('Waiting for PDF generation...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Take a screenshot as well
    console.log('Taking screenshot...');
    await page.screenshot({
        path: 'monitoring-screenshot.png',
        fullPage: true
    });

    console.log('Screenshot saved: monitoring-screenshot.png');

    // Get final statistics
    const stats = await page.evaluate(() => {
        const summaryItems = document.querySelectorAll('.summary-item');
        const results = {};
        summaryItems.forEach(item => {
            const label = item.querySelector('.summary-label')?.textContent || '';
            const value = item.querySelector('.summary-value')?.textContent || '';
            results[label] = value;
        });
        return results;
    });

    console.log('\n=== Monitoring Statistics ===');
    Object.entries(stats).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
    });
    console.log('===========================\n');

    await browser.close();
    console.log('Monitoring completed successfully!');
    console.log('Please check the Downloads folder for the generated PDF.');
    process.exit(0);
}

runMonitoring().catch(error => {
    console.error('Error during monitoring:', error);
    process.exit(1);
});
