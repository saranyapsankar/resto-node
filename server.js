const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

// MongoDB URI - Use environment variable from Vercel
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

// Middleware
const corsOptions = {
  origin: ['https://saranyapsankar.github.io', 'http://localhost:1234'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
};

app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// MongoDB Connection with options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  ssl: true,
  retryWrites: true
};

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables', MONGODB_URI, process.env);
  process.exit(1);
}

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

// Routes
app.use('/api/auth', authRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: `Welcome to Foodiee API ${req}`});
});

// Error handling middleware
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Export the Express API
module.exports = app; 