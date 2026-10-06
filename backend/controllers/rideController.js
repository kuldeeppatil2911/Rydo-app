const Booking = require('../models/Booking');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const notificationService = require('../services/notificationService');
const jwt = require('jsonwebtoken');

exports.estimateFare = (req, res) => {
  const { pickup, dropoff, rideType } = req.body;
  // Mock fare calculation
  const baseFare = rideType === 'Premium' ? 100 : 50;
  const distance = Math.floor(Math.random() * 15) + 5; // 5 to 20 km
  const time = distance * 2; // approx 2 mins per km
  const fare = baseFare + (distance * 10);

  const quote = {
    userId: req.user.id,
    pickup,
    dropoff,
    rideType,
    distance: `${distance} km`,
    time: `${time} mins`,
    fare: `₹${fare}`
  };

  res.json({
    ...quote,
    quoteToken: jwt.sign(quote, process.env.JWT_SECRET || 'secret123', { expiresIn: '10m' })
  });
};

exports.bookRide = async (req, res) => {
  try {
    const { pickup, dropoff, pickupCoords, dropoffCoords, rideType, paymentMode, tripMode, quoteToken } = req.body;
    let quote;
    try {
      quote = jwt.verify(quoteToken, process.env.JWT_SECRET || 'secret123');
    } catch {
      return res.status(400).json({ message: 'Fare estimate expired. Request a new estimate.' });
    }
    if (quote.userId !== req.user.id || quote.pickup !== pickup || quote.dropoff !== dropoff || quote.rideType !== rideType) {
      return res.status(400).json({ message: 'Fare estimate no longer matches this ride. Request a new estimate.' });
    }
    
    // Generate a random 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const booking = new Booking({
      user: req.user.id,
      pickup,
      dropoff,
      pickupCoords,
      dropoffCoords,
      rideType,
      paymentMode,
      tripMode,
      distance: quote.distance,
      fare: quote.fare,
      time: quote.time,
      otp,
      status: paymentMode === 'Card' ? 'Payment Pending' : 'Searching'
    });

    await booking.save();

    // Trigger Emergency Alert if enabled
    res.status(201).json({ booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getRideStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('driver');
    if (!booking) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (req.user.role === 'user' && String(booking.user) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'driver') {
      const assignedDriver = await Driver.exists({ _id: booking.driver, user: req.user.id });
      if (!assignedDriver) return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getMyRides = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('driver').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Could not load ride history' });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const allowed = ['Arriving', 'In Progress', 'Completed', 'Cancelled'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid ride status' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Ride not found' });
    if (req.user.role === 'user') {
      if (String(booking.user) !== req.user.id) return res.status(403).json({ message: 'Access denied' });
      if (req.body.status !== 'Cancelled' || !['Searching', 'Assigned'].includes(booking.status)) {
        return res.status(403).json({ message: 'Riders can only cancel rides that have not started' });
      }
    } else if (req.user.role === 'driver') {
      const assignedDriver = await Driver.exists({ _id: booking.driver, user: req.user.id });
      if (!assignedDriver) return res.status(403).json({ message: 'Ride is not assigned to this driver' });
      const nextStatuses = {
        Assigned: ['Arriving', 'Cancelled'],
        Arriving: ['In Progress', 'Cancelled'],
        'In Progress': ['Completed']
      };
      if (!nextStatuses[booking.status]?.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status transition' });
      }
    }
    booking.status = req.body.status;
    await booking.save();
    if (req.body.status === 'Completed' && booking.paymentMode === 'Cash') {
      await Payment.findOneAndUpdate(
        { booking: booking._id, method: 'Cash', status: 'Pending' },
        { status: 'Paid', paidAt: new Date() }
      );
    }
    if (['Completed', 'Cancelled'].includes(req.body.status) && booking.driver) {
      const driverFilter = { _id: booking.driver, status: 'Busy' };
      if (req.user.role === 'driver') driverFilter.user = req.user.id;
      await Driver.updateOne(driverFilter, { status: 'Available' });
    }
    if (req.body.status === 'In Progress') {
      const user = await User.findById(booking.user);
      if (booking.driver) {
        await booking.populate({ path: 'driver', populate: { path: 'user', select: 'phone' } });
      }
      await notificationService.sendEmergencyAlert(user, booking);
    }
    await booking.populate('driver');
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Could not update ride status' });
  }
};

exports.sendEmergencyAlert = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id })
      .populate({ path: 'driver', populate: { path: 'user', select: 'phone' } });
    if (!booking) return res.status(404).json({ message: 'Ride not found' });

    const user = await User.findById(req.user.id);
    const delivery = await notificationService.sendEmergencyAlert(user, booking, true);
    if (!delivery.emailSent && !delivery.smsSent) {
      return res.status(502).json({
        message: delivery.reason === 'no_contact'
          ? 'Add an emergency contact email in your profile first.'
          : delivery.reason === 'email_not_configured'
            ? 'Emergency email service is not configured. Add EMAIL_USER and EMAIL_PASS to the Render environment.'
            : 'Emergency alert could not be delivered. Check the saved contact details and notification service configuration.',
        delivery
      });
    }

    const channels = [delivery.emailSent && 'email', delivery.smsSent && 'SMS'].filter(Boolean);
    res.json({ message: `Emergency alert sent via ${channels.join(' and ')}.`, delivery });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Emergency alert could not be processed' });
  }
};
