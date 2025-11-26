const express = require('express');
const cors = require('cors');
const { initializeSocket } = require('./socket/chatSocket');

const app = express();

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://finance-tracker-ialp.onrender.com',
    'https://financetracker.space',
    'http://financetracker.space',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-timezone', 'x-request-timestamp', 'x-locale'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser()); 

// Initialize Socket.IO
initializeSocket(server);

//Keep my server alive
app.get('/api/ping', (req, res) => {
  res.send('pong');
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));