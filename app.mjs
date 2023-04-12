import passport from 'passport';
import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';
import PocketBase from 'pocketbase';
import mqtt from 'mqtt';
import session from 'express-session'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const http = new HttpServer(app);
const io = new SocketIoServer(http);
const port = process.env.PORT || 3000;
const pb = new PocketBase('http://127.0.0.1:8090');
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.urlencoded({ extended: false }));
// Configure session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Add the ensureAuthenticated middleware function
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.use(express.static('public', {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));

// Passport configuration for PocketBase
passport.serializeUser((user, done) => {
    done(null, user.record.id); // Change user.id to user.record.id
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await pb.collection('users').getOne(id);
        console.log('Deserialized user:', user); // Add this line to log the user object
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


app.use(passport.initialize());
app.use(passport.session());

// Modify the login route to use PocketBase authentication
app.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const authData = await pb.collection('users').authWithPassword(username, password);
        console.log('Auth data:', authData);
        req.login(authData, (err) => { // Change authData.model to authData
            if (err) {
                return next(err);
            }
            return res.redirect('/home');
        });
    } catch (error) {
        res.redirect('/login');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.status(500).send({ message: 'Error logging out' });
        } else {
            res.status(200).send({ message: 'Logged out successfully' });
        }
    });
});


// Serve index.html for the /home route
app.get('/home', ensureAuthenticated, (req, res) => {
    res.sendFile('nodes.html', { root: __dirname + '/public' });
});

app.get('/', ensureAuthenticated, (req, res) => {
    res.sendFile('login.html', { root: __dirname + '/public' });
});

// Serve login.html for the /login route
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname + '/public' });
});

// Add this after your app.use() line
app.get('/historicalData', ensureAuthenticated, (req, res) => {
    // Replace the following line with a call to the readHistoricalData function
    // once you've implemented it as described in the previous response
    const historicalData = []; // Example: readHistoricalData()
    res.json(historicalData);
});

http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const mqttBroker = 'mqtt://host.docker.internal:1883';
// const mqttBroker = 'mqtt://localhost:1883';
const topic = 'powerdata';

const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(topic);
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