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
        const { nodeName, voltage, ampere1, ampere2, ampere3, phaseAngle1, phaseAngle2, phaseAngle3, power1, power2, power3, timestamp } = item;

        if (!nodeName || typeof voltage === 'undefined') {
            console.error('Invalid historical data item:', item);
            return;
        }

        if (!charts[nodeName]) {
            createCharts(nodeName);
        }
        updateCharts(nodeName, voltage, [ampere1, ampere2, ampere3], [phaseAngle1, phaseAngle2, phaseAngle3], [power1, power2, power3], new Date(timestamp));
    });
}

const lastReceivedData = new Map();

socket.on('mqttData', (data) => {
    try {
        const { nodeName, voltage, ampere1, ampere2, ampere3, phaseAngle1, phaseAngle2, phaseAngle3, power1, power2, power3 } = data;

        if (!nodeName || typeof voltage === 'undefined') {
            console.error('Invalid data received:', data);
            return;
        }

        if (!charts[nodeName]) {
            createCharts(nodeName);
        }

        lastReceivedData.set(nodeName, new Date());
        updateCharts(nodeName, voltage, [ampere1, ampere2, ampere3], [phaseAngle1, phaseAngle2, phaseAngle3], [power1, power2, power3], new Date());
    } catch (error) {
        console.error('Error processing data:', error);
    }
});

function updateChartContainerBorder() {
    const oneMinute = 3000; // three seconds
    const tenMinutes = 2 * oneMinute;

    lastReceivedData.forEach((lastTimestamp, nodeName) => {
        const now = new Date();
        const container = document.querySelector(`.chart-container[data-node-name="${nodeName}"]`);
        const nodeNameElement = container.querySelector('h2');

        if (now - lastTimestamp >= tenMinutes) {
            container.style.border = '2px solid grey';
            nodeNameElement.innerHTML = `${nodeName} (Disconnected)`;
        } else if (now - lastTimestamp >= oneMinute) {
            container.style.border = '2px solid red';
            nodeNameElement.innerHTML = nodeName;
        } else {
            container.style.border = '2px solid green';
            nodeNameElement.innerHTML = nodeName;
        }
    });
}


(async () => {
    const historicalData = await fetchHistoricalData();
    renderHistoricalData(historicalData);
})();

setInterval(updateChartContainerBorder, 1000);

function createCharts(nodeName) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.setAttribute('data-node-name', nodeName);

    container.innerHTML = `
        <h2>${nodeName}</h2>
        <div id="${nodeName}-voltage" class="chart"></div>
        <div id="${nodeName}-ampere1" class="chart"></div>
        <div id="${nodeName}-ampere2" class="chart"></div>
        <div id="${nodeName}-ampere3" class="chart"></div>
        <div id="${nodeName}-phase-angle1" class="chart"></div>
        <div id="${nodeName}-phase-angle2" class="chart"></div>
        <div id="${nodeName}-phase-angle3" class="chart"></div>
        <div id="${nodeName}-power1" class="chart"></div>
        <div id="${nodeName}-power2" class="chart"></div>
        <div id="${nodeName}-power3" class="chart"></div>
    `;
    document.getElementById('charts-container').appendChild(container);

    const voltageCanvas = createCanvas(`${nodeName}-voltage`);
    const ampereCanvas1 = createCanvas(`${nodeName}-ampere1`);
    const ampereCanvas2 = createCanvas(`${nodeName}-ampere2`);
    const ampereCanvas3 = createCanvas(`${nodeName}-ampere3`);
    const phaseAngleCanvas1 = createCanvas(`${nodeName}-phase-angle1`);
    const phaseAngleCanvas2 = createCanvas(`${nodeName}-phase-angle2`);
    const phaseAngleCanvas3 = createCanvas(`${nodeName}-phase-angle3`);
    const powerCanvas1 = createCanvas(`${nodeName}-power1`);
    const powerCanvas2 = createCanvas(`${nodeName}-power2`);
    const powerCanvas3 = createCanvas(`${nodeName}-power3`);

    charts[nodeName] = {
        voltage: createChart(voltageCanvas, 'Voltage', 'V', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)', 190, 250),
        ampere: [
            createChart(ampereCanvas1, 'Ampere 1', 'A', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)'),
            createChart(ampereCanvas2, 'Ampere 2', 'A', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)'),
            createChart(ampereCanvas3, 'Ampere 3', 'A', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)'),
        ],
        phaseAngle: [
            createChart(phaseAngleCanvas1, 'Phase Angle 1', '°', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)'),
            createChart(phaseAngleCanvas2, 'Phase Angle 2', '°', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)'),
            createChart(phaseAngleCanvas3, 'Phase Angle 3', '°', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)'),
        ], 
        power: [
            createChart(powerCanvas1, 'Power 1', 'W', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)'),
            createChart(powerCanvas2, 'Power 2', 'W', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)'),
            createChart(powerCanvas3, 'Power 3', 'W', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)'),
    ],
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

    charts[nodeName].ampere.forEach((ampereChart, index) => {
        if (ampereChart.data.labels.length >= maxDataPoints) {
            ampereChart.data.labels.shift();
            ampereChart.data.datasets[0].data.shift();
        }
        ampereChart.data.labels.push(timestamp);
        ampereChart.data.datasets[0].data.push(ampere[index]);
        ampereChart.update();
    });

    charts[nodeName].phaseAngle.forEach((phaseAngleChart, index) => {
        if (phaseAngleChart.data.labels.length >= maxDataPoints) {
            phaseAngleChart.data.labels.shift();
            phaseAngleChart.data.datasets[0].data.shift();
        }
        phaseAngleChart.data.labels.push(timestamp);
        phaseAngleChart.data.datasets[0].data.push(phaseAngle[index]);
        phaseAngleChart.update();
    });

    charts[nodeName].power.forEach((powerChart, index) => {
        if (powerChart.data.labels.length >= maxDataPoints) {
            powerChart.data.labels.shift();
            powerChart.data.datasets[0].data.shift();
        }
        powerChart.data.labels.push(timestamp);
        powerChart.data.datasets[0].data.push(power[index]);
        powerChart.update();
    });
}
