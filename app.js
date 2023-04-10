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

http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


mqttClient.on('message', (topic, message) => {
    const data = JSON.parse(message);
    io.emit('mqttData', data);
});
