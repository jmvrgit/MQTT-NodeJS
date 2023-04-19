const socket = io();

const charts = {};

// async function fetchHistoricalData() {
//     try {
//         const response = await fetch('/historicalData');
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Error fetching historical data:', error);
//         return [];
//     }
// }

// function renderHistoricalData(data) {
//     data.forEach(item => {
//         const { nodeName, voltage, ampere1, ampere2, ampere3, phaseAngle1, phaseAngle2, phaseAngle3, power1, power2, power3, timestamp } = item;

//         if (!nodeName || typeof voltage === 'undefined') {
//             console.error('Invalid historical data item:', item);
//             return;
//         }

//         if (!charts[nodeName]) {
//             createCharts(nodeName);
//         }
//         updateCharts(nodeName, voltage, [ampere1, ampere2, ampere3], [phaseAngle1, phaseAngle2, phaseAngle3], [power1, power2, power3], new Date(timestamp));
//     });
// }

const lastReceivedData = new Map();

function updateChartContainerBorder() {
    const oneMinute = 3000; // three seconds
    const tenMinutes = 2 * oneMinute;

    lastReceivedData.forEach((lastTimestamp, nodeName) => {
        const now = new Date();
        const container = document.querySelector(`.chart-container[data-node-name="${nodeName}"]`);
        const nodeNameElement = container.querySelector('h2');
        const relayCheckboxes = container.querySelectorAll('.relay-control');

        if (now - lastTimestamp >= tenMinutes) {
            container.style.border = '2px solid grey';
            nodeNameElement.innerHTML = `${nodeName} (Disconnected)`;
            relayCheckboxes.forEach(checkbox => {
                checkbox.disabled = true;
            });
        } else if (now - lastTimestamp >= oneMinute) {
            container.style.border = '2px solid red';
            nodeNameElement.innerHTML = nodeName;
            relayCheckboxes.forEach(checkbox => {
                checkbox.disabled = false;
            });
        } else {
            container.style.border = '2px solid green';
            nodeNameElement.innerHTML = nodeName;
            relayCheckboxes.forEach(checkbox => {
                checkbox.disabled = false;
            });
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
        <label for="${nodeName}-relay1">Relay 1: </label>
        <input type="checkbox" id="${nodeName}-relay1" class="relay-control" data-node-name="${nodeName}" data-relay-number="1">
        <label for="${nodeName}-relay2">Relay 2: </label>
        <input type="checkbox" id="${nodeName}-relay2" class="relay-control" data-node-name="${nodeName}" data-relay-number="2">
        <label for="${nodeName}-relay3">Relay 3: </label>
        <input type="checkbox" id="${nodeName}-relay3" class="relay-control" data-node-name="${nodeName}" data-relay-number="3">        
        <p>Status: ${status}</p>
        <div id="${nodeName}-voltage" class="chart"></div>
        <div class="group">
            <div id="${nodeName}-ampere1" class="chart"></div>
            <div id="${nodeName}-phase-angle1" class="chart"></div>
            <div id="${nodeName}-power1" class="chart"></div>
        </div>
        <div class="group">
            <div id="${nodeName}-ampere2" class="chart"></div>
            <div id="${nodeName}-phase-angle2" class="chart"></div>
            <div id="${nodeName}-power2" class="chart"></div>
        </div>
        <div class="group">
            <div id="${nodeName}-ampere3" class="chart"></div>
            <div id="${nodeName}-phase-angle3" class="chart"></div>
            <div id="${nodeName}-power3" class="chart"></div>
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

        const relaySwitch1 = container.querySelector(`#${nodeName}-relay1`);
    const relaySwitch2 = container.querySelector(`#${nodeName}-relay2`);
    const relaySwitch3 = container.querySelector(`#${nodeName}-relay3`);

    relaySwitch1.addEventListener('change', (event) => {
        const relay1StatusON = event.target.checked;
        const relay2StatusON = relaySwitch2.checked;
        const relay3StatusON = relaySwitch3.checked;
        sendRelayControl(nodeName, relay1StatusON, relay2StatusON, relay3StatusON);
    });

    relaySwitch2.addEventListener('change', (event) => {
        const relay1StatusON = relaySwitch1.checked;
        const relay2StatusON = event.target.checked;
        const relay3StatusON = relaySwitch3.checked;
        sendRelayControl(nodeName, relay1StatusON, relay2StatusON, relay3StatusON);
    });

    relaySwitch3.addEventListener('change', (event) => {
        const relay1StatusON = relaySwitch1.checked;
        const relay2StatusON = relaySwitch2.checked;
        const relay3StatusON = event.target.checked;
        sendRelayControl(nodeName, relay1StatusON, relay2StatusON, relay3StatusON);
    });
    // const relaySwitch1 = container.querySelector(`#${nodeName}-relay1`);
    // const relaySwitch2 = container.querySelector(`#${nodeName}-relay2`);
    // const relaySwitch3 = container.querySelector(`#${nodeName}-relay3`);
    
    // relaySwitch1.addEventListener('change', async (event) => {
    //     const relay1StatusON = event.target.checked;
    //     const data = { nodeName, relay1StatusON };
    
    //     try {
    //         const response = await fetch(`/relaycontrols/${nodeName}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(data),
    //         });
    
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }
    //     } catch (error) {
    //         console.error('Error sending relay control:', error);
    //     }
    // });
    
    // relaySwitch2.addEventListener('change', async (event) => {
    //     const relay2StatusON = event.target.checked;
    //     const data = { nodeName, relay2StatusON };
    
    //     try {
    //         const response = await fetch(`/relaycontrols/${nodeName}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(data),
    //         });
    
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }
    //     } catch (error) {
    //         console.error('Error sending relay control:', error);
    //     }
    // });
    
    // relaySwitch3.addEventListener('change', async (event) => {
    //     const relay3StatusON = event.target.checked;
    //     const data = { nodeName, relay3StatusON };
    
    //     try {
    //         const response = await fetch(`/relaycontrols/${nodeName}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(data),
    //         });
    
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }
    //     } catch (error) {
    //         console.error('Error sending relay control:', error);
    //     }
    // });
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

function updateCharts(nodeName, voltage, ampere, phaseAngle, power, timestamp, relayStatuses, status) {
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
    
    relayStatuses.forEach((relayStatus, index) => {
        const relaySwitch = document.querySelector(`#${nodeName}-relay${index + 1}`);
        if (relaySwitch) {
            relaySwitch.checked = relayStatus;
        }
    });

    const container = document.querySelector(`.chart-container[data-node-name="${nodeName}"]`);
    const statusElement = container.querySelector('p');
    statusElement.innerHTML = `Status: ${status}`;

}

// document.addEventListener('change', (event) => {
//     const target = event.target;
//     if (target.classList.contains('relay-control')) {
//         const nodeName = target.getAttribute('data-node-name');
//         const relayNumber = parseInt(target.getAttribute('data-relay-number'), 10);
//         const relayStatusON = target.checked;
//         console.log(nodeName, relayNumber, relayStatusON);
//         sendRelayControl(nodeName, relayNumber, relayStatusON);
//     }
// });

function sendRelayControl(nodeName, relay1StatusON, relay2StatusON, relay3StatusON) {
    const data = {
        nodeName: nodeName,
        R1: relay1StatusON,
        R2: relay2StatusON,
        R3: relay3StatusON,
    };
    console.log(data);
    socket.emit('relayControl', data);
}

socket.on('mqttData', (data) => {
    try {
        const { node, V, A1, A2, A3, PF1, PF2, PF3, W1, W2, W3, R1, R2, R3, status } = data;

        if (!node || typeof V === 'undefined') {
            console.error('Invalid data received:', data);
            return;
        }

        if (!charts[node]) {
            createCharts(node);
        }

        lastReceivedData.set(node, new Date());
        updateCharts(node, V, [A1, A2, A3], [PF1, PF2, PF3], [W1, W2, W3], new Date(), [R1, R2, R3], status);
    } catch (error) {
        console.error('Error processing data:', error);
    }
});

document.getElementById('logout-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Redirect to the login page after successful logout
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});
