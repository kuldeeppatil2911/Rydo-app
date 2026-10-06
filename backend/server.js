const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Driver = require('./models/Driver');
const { getDemoUsers } = require('./demoUsers');

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').handleStripeWebhook);
app.use(express.json());

const { MongoMemoryServer } = require('mongodb-memory-server');

// Database connection
const connectDB = async () => {
  try {
    if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'secret123')) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }

    let dbUri = process.env.MONGODB_URI;

    if (!dbUri && isProduction) {
      throw new Error('MONGODB_URI is required in production.');
    }

    if (!dbUri) {
      console.log("No MONGODB_URI found in .env. Starting up in-memory MongoDB for testing...");
      const mongoServer = await MongoMemoryServer.create();
      dbUri = mongoServer.getUri();
    }

    await mongoose.connect(dbUri);
    console.log('MongoDB connected successfully.');

    const existingUsers = await User.countDocuments();
    if (existingUsers === 0 && !isProduction) {
      const demoUsers = await getDemoUsers();
      await User.insertMany(demoUsers);
      console.log('Demo users seeded successfully');
    }

    if (!isProduction && await Driver.countDocuments() === 0) {
      const demoDriver = await User.findOne({ role: 'driver' });
      if (demoDriver) {
        await Driver.create({
          user: demoDriver._id,
          name: demoDriver.name,
          vehicle: 'Tesla Model 3',
          plate: 'EV-01-XX-9999'
        });
      }
    }
  } catch (error) {
    console.error('MongoDB connection failed:', isProduction ? 'Check database configuration and connectivity.' : error.message);
    throw error;
  }
};

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ride', require('./routes/rideRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

app.get('/api', (req, res) => {
  res.send('Rydo Backend API is running');
});

if (isProduction && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Application startup failed:', isProduction ? 'Check production configuration and database connectivity.' : error.message);
    process.exit(1);
  }
};

startServer();
