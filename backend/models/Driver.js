const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  vehicle: { type: String, required: true },
  plate: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  status: { type: String, default: 'Available', enum: ['Available', 'Busy', 'Offline'] },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  }
});

module.exports = mongoose.model('Driver', driverSchema);
