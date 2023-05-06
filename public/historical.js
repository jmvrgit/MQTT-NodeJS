const perPage = 50;
let currentPage = 1;
let allResults = [];
const charts = {};

function fetchPage() {
  fetch(`/historicalData?page=${currentPage}`)
    .then(response => response.json())
    .then(data => {
      allResults = allResults.concat(data.items);
      if (currentPage < data.totalPages) {
        currentPage++;
        fetchPage();
      } else {
        console.log(allResults);
        // Find unique nodes and create charts for them
        const uniqueNodes = Array.from(new Set(allResults.map(item => item.node)));
        console.log(uniqueNodes)
        uniqueNodes.forEach(node => createCharts(node));
        // Update charts with historical data
        allResults.forEach(item => {
            updateCharts(
                item.node,
                item.v,
                [item.a1, item.a2, item.a3],
                [item.pf1, item.pf2, item.pf3],
                [item.w1, item.w2, item.w3],
                [item.e1, item.e2, item.e3],
                item.created,
                [item.r1, item.r2, item.r3],
                item.status
            );
        });
      }
    })
    .catch(error => console.error(error));
}

fetchPage();

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

function createCharts(nodeName, relayStatuses) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.setAttribute('data-node-name', nodeName);

    container.innerHTML = `
        <h2>${nodeName}</h2>
        <div id="${nodeName}-voltage" class="chart"></div>
        <div class="group">
            <div id="${nodeName}-ampere1" class="chart"></div>
            <div id="${nodeName}-phase-angle1" class="chart"></div>
            <div id="${nodeName}-power1" class="chart"></div>
            <div id="${nodeName}-energy1" class="chart"></div>
        </div>
        <div class="group">
            <div id="${nodeName}-ampere2" class="chart"></div>
            <div id="${nodeName}-phase-angle2" class="chart"></div>
            <div id="${nodeName}-power2" class="chart"></div>
            <div id="${nodeName}-energy2" class="chart"></div>
        </div>
        <div class="group">
            <div id="${nodeName}-ampere3" class="chart"></div>
            <div id="${nodeName}-phase-angle3" class="chart"></div>
            <div id="${nodeName}-power3" class="chart"></div>
            <div id="${nodeName}-energy3" class="chart"></div>
        </div>
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
    const energyCanvas1 = createCanvas(`${nodeName}-energy1`);
    const energyCanvas2 = createCanvas(`${nodeName}-energy2`);
    const energyCanvas3 = createCanvas(`${nodeName}-energy3`);

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
        energy: [
            createChart(energyCanvas1, 'Energy 1', 'KWh', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 60, 255, 1)'),
            createChart(energyCanvas2, 'Energy 2', 'KWh', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 60, 64, 1)'),
            createChart(energyCanvas3, 'Energy 3', 'KWh', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 60, 192, 1)'),
        ],
    };
}


function updateCharts(nodeName, voltage, ampere, phaseAngle, power, energy, timestamp,relayStatuses, status) {
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

    charts[nodeName].energy.forEach((energyChart, index) => {
        if (energyChart.data.labels.length >= maxDataPoints) {
            energyChart.data.labels.shift();
            energyChart.data.datasets[0].data.shift();
        }
        energyChart.data.labels.push(timestamp);
        energyChart.data.datasets[0].data.push(energy[index]);
        energyChart.update();
    });
}