const Booking = require('../models/Booking');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');

exports.getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const activeRides = await Booking.countDocuments({ status: { $in: ['Assigned', 'Arriving', 'In Progress'] } });
    
    const revenueData = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, revenue: { $sum: { $toDouble: { $replaceAll: { input: '$amount', find: '₹', replacement: '' } } } } } },
      { $project: { _id: 0, name: '$_id', revenue: 1 } }
    ]);

    res.json({
      totalBookings,
      totalUsers,
      totalDrivers,
      activeRides,
      totalPayments: await Payment.countDocuments({ status: 'Paid' }),
      revenueData
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate({ path: 'driver', select: 'name vehicle plate rating user', populate: { path: 'user', select: 'phone' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
