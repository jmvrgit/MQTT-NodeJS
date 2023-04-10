const socket = io();

const charts = {};

async function fetchHistoricalData() {
    try {
        const response = await fetch('/historicalData');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

function renderHistoricalData(data) {
    data.forEach(item => {
        const { nodeName, voltage, ampere, phaseAngle, power, timestamp } = item;

        if (!nodeName || typeof voltage === 'undefined' || typeof ampere === 'undefined' || typeof phaseAngle === 'undefined' || typeof power === 'undefined') {
            console.error('Invalid historical data item:', item);
            return;
        }

        if (!charts[nodeName]) {
            createCharts(nodeName);
        }
        updateCharts(nodeName, voltage, ampere, phaseAngle, power, new Date(timestamp));
    });
}

socket.on('mqttData', (data) => {
    try {
        const { nodeName, voltage, ampere, phaseAngle, power } = data;

        if (!nodeName || typeof voltage === 'undefined' || typeof ampere === 'undefined' || typeof phaseAngle === 'undefined' || typeof power === 'undefined') {
            console.error('Invalid data received:', data);
            return;
        }

        if (!charts[nodeName]) {
            createCharts(nodeName);
        }
        updateCharts(nodeName, voltage, ampere, phaseAngle, power, new Date());
    } catch (error) {
        console.error('Error processing data:', error);
    }
});

(async () => {
    const historicalData = await fetchHistoricalData();
    renderHistoricalData(historicalData);
})();

function createCharts(nodeName) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = `
        <h2>${nodeName}</h2>
        <div id="${nodeName}-voltage" class="chart"></div>
        <div id="${nodeName}-ampere" class="chart"></div>
        <div id="${nodeName}-phase-angle" class="chart"></div>
        <div id="${nodeName}-power" class="chart"></div>
    `;
    document.getElementById('charts-container').appendChild(container);

    const voltageCanvas = createCanvas(`${nodeName}-voltage`);
    const ampereCanvas = createCanvas(`${nodeName}-ampere`);
    const phaseAngleCanvas = createCanvas(`${nodeName}-phase-angle`);
    const powerCanvas = createCanvas(`${nodeName}-power`);

    charts[nodeName] = {
        voltage: createChart(voltageCanvas, 'Voltage', 'V', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)',190,250),
        ampere: createChart(ampereCanvas, 'Ampere', 'A', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)'),
        phaseAngle: createChart(phaseAngleCanvas, 'Phase Angle', '°', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)'),
        power: createChart(powerCanvas, 'Power', 'W', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)'),
    };
}

function createCanvas(parentId) {
    const parent = document.getElementById(parentId);
    const canvas = document.createElement('canvas');
    parent.appendChild(canvas);
    return canvas;
}

function createChart(canvas, label, unit, backgroundColor, borderColor, minY = undefined, maxY = undefined) {
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: `${label} (${unit})`,
                data: [],
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1,
            }],
        },
        options: {
            animation: {
                duration: 0, // Disable animations by setting duration to 0
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                    },
                },
                y: {
                    beginAtZero: minY === undefined,
                    min: minY,
                    max: maxY,
                },
            },
        },
    });
}

function updateCharts(nodeName, voltage, ampere, phaseAngle, power, timestamp) {
    const maxDataPoints = 100;

    const voltageChart = charts[nodeName].voltage;
    if (voltageChart.data.labels.length >= maxDataPoints) {
        voltageChart.data.labels.shift();
        voltageChart.data.datasets[0].data.shift();
    }
    voltageChart.data.labels.push(timestamp);
    voltageChart.data.datasets[0].data.push(voltage);
    voltageChart.update();

    const ampereChart = charts[nodeName].ampere;
    if (ampereChart.data.labels.length >= maxDataPoints) {
        ampereChart.data.labels.shift();
        ampereChart.data.datasets[0].data.shift();
    }
    ampereChart.data.labels.push(timestamp);
    ampereChart.data.datasets[0].data.push(ampere);
    ampereChart.update();

    const phaseAngleChart = charts[nodeName].phaseAngle;
    if (phaseAngleChart.data.labels.length >= maxDataPoints) {
        phaseAngleChart.data.labels.shift();
        phaseAngleChart.data.datasets[0].data.shift();
    }
    phaseAngleChart.data.labels.push(timestamp);
    phaseAngleChart.data.datasets[0].data.push(phaseAngle);
    phaseAngleChart.update();

    const powerChart = charts[nodeName].power;
    if (powerChart.data.labels.length >= maxDataPoints) {
        powerChart.data.labels.shift();
        powerChart.data.datasets[0].data.shift();
    }
    powerChart.data.labels.push(timestamp);
    powerChart.data.datasets[0].data.push(power);
    powerChart.update();
}