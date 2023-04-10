const socket = io();

const charts = {};

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
        updateCharts(nodeName, voltage, ampere, phaseAngle, power);
    } catch (error) {
        console.error('Error processing data:', error);
    }
});


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
        voltage: createChart(voltageCanvas, 'Voltage', 'V', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)'),
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

function createChart(canvas, label, unit, backgroundColor, borderColor) {
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
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                    },
                },
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}


function updateCharts(nodeName, voltage, ampere, phaseAngle, power) {
    const timestamp = new Date();

    const voltageChart = charts[nodeName].voltage;
    voltageChart.data.labels.push(timestamp);
    voltageChart.data.datasets[0].data.push(voltage);
    voltageChart.update();

    const ampereChart = charts[nodeName].ampere;
    ampereChart.data.labels.push(timestamp);
    ampereChart.data.datasets[0].data.push(ampere);
    ampereChart.update();

    const phaseAngleChart = charts[nodeName].phaseAngle;
    phaseAngleChart.data.labels.push(timestamp);
    phaseAngleChart.data.datasets[0].data.push(phaseAngle);
    phaseAngleChart.update();

    const powerChart = charts[nodeName].power;
    powerChart.data.labels.push(timestamp);
    powerChart.data.datasets[0].data.push(power);
    powerChart.update();
}
