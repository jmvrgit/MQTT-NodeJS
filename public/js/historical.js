const charts = {};

document.getElementById('Dbase-button').addEventListener('click', function() {
  const startDate = document.getElementById('startDateInput').value;
  const endDate = document.getElementById('endDateInput').value;

  // Convert start date and end date from GMT+8 to UTC
  const startDateUTC = new Date(startDate).toISOString().slice(0,16).replace("T", " ");
  const endDateUTC = new Date(endDate).toISOString().slice(0,16).replace("T", " ");

  // Fetch using the converted UTC dates
  fetch(`/historicalData?startDate=${startDateUTC}&endDate=${endDateUTC}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const allResults = data;
      console.log(allResults);

      // Assuming 'data' is an array of your data objects
      data.forEach(datum => {
        const nodeName = datum.node;
        // Create charts for this node if they do not exist
        if (!charts[nodeName]) {
            createCharts(nodeName, [datum.r1, datum.r2, datum.r3]);
        }

        // Update charts for this node
        updateCharts(
            nodeName,
            datum.v,
            [datum.a1, datum.a2, datum.a3],
            [datum.pf1, datum.pf2, datum.pf3],
            [datum.w1, datum.w2, datum.w3],
            [datum.e1, datum.e2, datum.e3],
            datum.created,
            [datum.r1, datum.r2, datum.r3],
            datum.status
        );
      });
    })
    .catch(error => console.error(error));
});



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
        <div class="collapsible-container">
        <h2>${nodeName}</h2>
        <p id="${nodeName}-average-voltage">Average Voltage: </p>
        <p id="${nodeName}-average-current">Average Current: </p>
        <p id="${nodeName}-average-power">Average Power: </p>        
        <div class="collapsible-content">
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
        </div>
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

  if (!charts[nodeName].runningStats) {
      charts[nodeName].runningStats = {
          voltage: { total: 0, count: 0 },
          ampere: { total: 0, count: 0 },
          power: { total: 0, count: 0 },
      };
  }
  const voltageChart = charts[nodeName].voltage;
  if (voltageChart.data.labels.length >= maxDataPoints) {
      voltageChart.data.labels.shift();
      voltageChart.data.datasets[0].data.shift();
  }

  voltageChart.data.labels.push(timestamp);
  voltageChart.data.datasets[0].data.push(voltage);
  voltageChart.update();

  charts[nodeName].runningStats.voltage.total += voltage;
  charts[nodeName].runningStats.voltage.count++;
  const voltageAverage = charts[nodeName].runningStats.voltage.total / charts[nodeName].runningStats.voltage.count;
  // console.log("Average Voltage "+ nodeName + " " + voltageAverage);
  const avgVoltageElement = document.getElementById(`${nodeName}-average-voltage`);
  if (avgVoltageElement) {
      avgVoltageElement.innerText = `Average Voltage: ${voltageAverage.toFixed(2)}`;
  }

  charts[nodeName].ampere.forEach((ampereChart, index) => {
      if (ampereChart.data.labels.length >= maxDataPoints) {
          ampereChart.data.labels.shift();
          ampereChart.data.datasets[0].data.shift();
      }
      ampereChart.data.labels.push(timestamp);
      ampereChart.data.datasets[0].data.push(ampere[index]);
      ampereChart.update();

      charts[nodeName].runningStats.ampere.total += ampere[index];
      charts[nodeName].runningStats.ampere.count++;
      const ampereAverage = charts[nodeName].runningStats.ampere.total / charts[nodeName].runningStats.ampere.count;
      // console.log("Average Current "+ nodeName + " " + ampereAverage);
      const avgcurrentElement = document.getElementById(`${nodeName}-average-current`);
      if (avgcurrentElement) {
          avgcurrentElement.innerText = `Average Current: ${ampereAverage.toFixed(2)}`;
      }
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

      charts[nodeName].runningStats.power.total += power[index];
      charts[nodeName].runningStats.power.count++;
      const powerAverage = charts[nodeName].runningStats.power.total / charts[nodeName].runningStats.power.count;
      // console.log("Average power "+ nodeName + " " + powerAverage);
      const avgpowerElement = document.getElementById(`${nodeName}-average-power`);
      if (avgpowerElement) {
          avgpowerElement.innerText = `Average Power: ${powerAverage.toFixed(2)}`;
      }
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
document.getElementById('Live-button').addEventListener('click', () => {
  try {
    // Redirect to the live.html page
    window.location.href = 'home';
  } catch (error) {
    console.error('Error redirecting to live page:', error);
  }
});