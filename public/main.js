const socket = io();

const charts = {};

socket.on('mqttData', (data) => {
    const { nodeName, voltage, ampere, phaseAngle, power } = data;

    if (!charts[nodeName]) {
        createCharts(nodeName);
    }
    updateCharts(nodeName, voltage, ampere, phaseAngle, power);
});

function createCharts(nodeName) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = `
        <h2>${nodeName}</h2>
        <canvas id="${nodeName}-voltage"></canvas>
        <canvas id="${nodeName}-ampere"></canvas>
        <canvas id="${nodeName}-phase-angle"></canvas>
        <canvas id="${nodeName}-power"></canvas>
    `;
    document.getElementById('charts-container').appendChild(container);

    charts[nodeName] = {
        voltage: createChart(`${nodeName}-voltage`, 'Voltage', 'V', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)'),
        ampere: createChart(`${nodeName}-ampere`, 'Ampere', 'A', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)'),
        phaseAngle: createChart(`${nodeName}-phase-angle`, 'Phase Angle', '°', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)'),
        power: createChart(`${nodeName}-power`, 'Power', 'W', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)'),
    };
}

function createChart(elementId, label, unit, backgroundColor, borderColor) {
    const ctx = document.getElementById(elementId).getContext('2d');
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
