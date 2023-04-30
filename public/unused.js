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

// (async () => {
//     const historicalData = await fetchHistoricalData();
//     renderHistoricalData(historicalData);
// })();
