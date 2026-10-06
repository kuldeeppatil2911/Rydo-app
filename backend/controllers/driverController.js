const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const { sendRideAssignedEmail } = require('../services/notificationService');

exports.getPendingRides = async (req, res) => {
  try {
    const rides = await Booking.find({ status: 'Searching' }).populate('user', 'name phone').sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id, status: 'Available' },
      { status: 'Busy' },
      { returnDocument: 'after' }
    );
    if (!driver) return res.status(403).json({ message: 'No available driver profile is linked to this account' });

    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'Searching' },
      { status: 'Assigned', driver: driver._id },
      { returnDocument: 'after' }
    );
    if (!booking) {
      await Driver.updateOne({ _id: driver._id, status: 'Busy' }, { status: 'Available' });
      return res.status(409).json({ message: 'Ride is no longer available' });
    }

    const bookingUser = await booking.populate('user');
    await sendRideAssignedEmail(bookingUser.user, booking, driver);

    res.json({ message: 'Ride accepted successfully', booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAssignedRides = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.id });
  if (!driver) return res.json([]);
  const rides = await Booking.find({ driver: driver._id, status: { $nin: ['Completed', 'Cancelled'] } }).populate('user', 'name phone').sort({ updatedAt: -1 });
  res.json(rides);
};
