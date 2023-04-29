import passport from 'passport';
import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';
import PocketBase from 'pocketbase';
import axios from 'axios';
import mqtt from 'mqtt';
import session from 'express-session'
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const app = express();
const http = new HttpServer(app);
const io = new SocketIoServer(http);
const port = process.env.PORT || 3000;
// const pb = new PocketBase('http://host.docker.internal:8090');
const pb = new PocketBase('http://localhost:8090');
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
        //console.log('Deserialized user:', user); // Add this line to log the user object
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


app.use(passport.initialize());
app.use(passport.session());

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
    // Check database connection
    // axios.get('http://host.docker.internal:8090/_/')
    axios.get('http://localhost:8090/_/')
      .then(() => {
        // Database is up, send login page
        res.sendFile('login.html', { root: __dirname + '/public' });
      })
      .catch(() => {
        // Database is down, send error message
        res.status(500).send('Database is currently down. Make sure that the database is up.');
      });
});

app.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  try {
      const authData = await pb.collection('users').authWithPassword(username, password);
      //console.log('Auth data:', authData);
      req.login(authData, (err) => { // Change authData.model to authData
          if (err) {
              // console.log(err)
              return next(err);
          }
          return res.redirect('/home');
      });
  } catch (error) {
      console.log(error)
      res.redirect('/login');
  }
});

// app.get('/historicalData', ensureAuthenticated, async (req, res) => {
//     try {
//         // Fetch all unique nodes
//         const uniqueNodes = await pb.collection('powerdata').getFullList(1,20);

//         // Initialize an empty array to store the last 20 data points for each unique node
//         const historicalData = [];

//         // Calculate the timestamp for 10 seconds ago
//         const tenSecondsAgo = new Date(Date.now() - 10 * 1000);

//         // Fetch the last 20 data points for each unique node
//         for (const node of uniqueNodes) {
//             const nodeData = await pb.collection('powerdata').getList(1, 20);

//             // Filter the node data based on the timestamp
//             const filteredNodeData = nodeData.items.filter(item => {
//                 const itemCreated = new Date(item.created);
//                 return itemCreated >= tenSecondsAgo;
//             });

//             // Add the filtered node data to the historicalData array
//             historicalData.push(...filteredNodeData);
//         }

//         // Return the historical data as a JSON response
//         res.json(historicalData);
//     } catch (error) {
//         console.error('Error fetching historical data:', error.stack);
//         res.status(500).json({ error: 'Failed to fetch historical data' });
//     }
// });


http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// const mqttBroker = 'mqtt://host.docker.internal:1883';
const mqttBroker = 'mqtt://localhost:1883';
const topic = 'powerdata';

const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(topic);
});

mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message);
        io.emit('mqttData', data);
        const record = await pb.collection('powerdata').create(data);
        // console.log(data);
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

app.use(express.json());
// Assuming you have created a WebSocket server using socket.io

// app.post('/relaycontrols/:nodeName', (req, res) => {
//     const { nodeName } = req.params;
//     const { relay1StatusON, relay2StatusON, relay3StatusON } = req.body;

//     console.log(`Relay control for ${nodeName}: Relay1=${relay1StatusON}, Relay2=${relay2StatusON}, Relay3=${relay3StatusON}`);
//     const relayTopic = `/relaycontrols/${nodeName}`;
//     const relayPayload = JSON.stringify({ nodeName, R1: relay1StatusON, R2: relay2StatusON, R3: relay3StatusON });

//     mqttClient.publish(relayTopic, relayPayload, {}, (err) => {
//         if (err) {
//             console.error(`Error publishing to ${relayTopic}:`, err);
//             res.sendStatus(500);
//         } else {
//             console.log(`Published to ${relayTopic}:`, relayPayload);
//             res.sendStatus(200);
//         }
//     });
// });

// Assuming you have created a WebSocket server using socket.io
io.on('connection', (socket) => {
    console.log('A client has connected');
  
    // Listen for the 'relayControl' event
    socket.on('relayControl', (data) => {
      const { node, r1, r2, r3 } = data;
      console.log(`Relay control for ${node}: R1=${r1}, R2=${r2}, R3=${r3}`);
      const relayTopic = `/relaycontrols/${node}`;
      const relayPayload = JSON.stringify({ node, r1: r1, r2: r2, r3: r3 });
  
      mqttClient.publish(relayTopic, relayPayload, {}, (err) => {
        if (err) {
          console.error(`Error publishing to ${relayTopic}:`, err);
        } else {
          console.log(`Published to ${relayTopic}:`, relayPayload);
        }
      });
    });
  });
