const mqtt = require('mqtt');

const mqttBroker = 'mqtt://localhost:1883';
const topic = 'powerdata';

const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(topic);
});


const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

// Add this after your app.use() line
app.get('/historicalData', (req, res) => {
    // Replace the following line with a call to the readHistoricalData function
    // once you've implemented it as described in the previous response
    const historicalData = []; // Example: readHistoricalData()
    res.json(historicalData);
});

http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


mqttClient.on('message', (topic, message) => {
    const data = JSON.parse(message);
    io.emit('mqttData', data);
});

app.use(express.json());
app.post('/relaycontrols/:nodeName', (req, res) => {
    const { nodeName } = req.params;
    const { relayStatusON } = req.body;

    console.log(`Relay control for ${nodeName}:`, relayStatusON);
    const relayTopic = `/relaycontrols/${nodeName}`;
    const relayPayload = JSON.stringify({ nodeName, relayStatusON });

    mqttClient.publish(relayTopic, relayPayload, {}, (err) => {
        if (err) {
            console.error(`Error publishing to ${relayTopic}:`, err);
            res.sendStatus(500);
        } else {
            console.log(`Published to ${relayTopic}:`, relayPayload);
            res.sendStatus(200);
        }
    });
});