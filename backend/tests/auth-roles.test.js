const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { register, login } = require('../controllers/authController');

const callController = async (controller, body) => {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    }
  };
  await controller({ body }, response);
  return response;
};

test('role signup codes gate driver/admin accounts and driver signup creates a profile', async (t) => {
  const originalDriverCode = process.env.DRIVER_SIGNUP_CODE;
  const originalAdminCode = process.env.ADMIN_SIGNUP_CODE;
  const mongoServer = await MongoMemoryServer.create();
  process.env.DRIVER_SIGNUP_CODE = 'test-driver-code';
  process.env.ADMIN_SIGNUP_CODE = 'test-admin-code';

  try {
    await mongoose.connect(mongoServer.getUri());

    await t.test('ordinary signup creates a user account', async () => {
      const response = await callController(register, {
        name: 'Rider',
        email: 'rider@example.test',
        password: 'rider-password'
      });

      assert.equal(response.statusCode, 201);
      assert.equal(response.body.user.role, 'user');
    });

    await t.test('driver/admin signup rejects a missing or invalid code', async () => {
      const driverResponse = await callController(register, {
        name: 'Driver', email: 'driver@example.test', password: 'driver-password', role: 'driver'
      });
      const adminResponse = await callController(register, {
        name: 'Admin', email: 'admin@example.test', password: 'admin-password', role: 'admin', invitationCode: 'wrong'
      });

      assert.equal(driverResponse.statusCode, 403);
      assert.equal(adminResponse.statusCode, 403);
      assert.equal(await User.countDocuments({ role: { $in: ['driver', 'admin'] } }), 0);
    });

    await t.test('valid driver code creates both role and vehicle profile', async () => {
      const response = await callController(register, {
        name: 'Driver',
        email: 'driver@example.test',
        password: 'driver-password',
        role: 'driver',
        invitationCode: 'test-driver-code',
        vehicle: 'Test Car',
        plate: 'TEST-123'
      });

      assert.equal(response.statusCode, 201);
      assert.equal(response.body.user.role, 'driver');
      assert.ok(await Driver.findOne({ user: response.body.user.id, vehicle: 'Test Car', plate: 'TEST-123' }));
    });

    await t.test('login role selector verifies the account role', async () => {
      const mismatch = await callController(login, {
        email: 'driver@example.test', password: 'driver-password', expectedRole: 'admin'
      });
      const match = await callController(login, {
        email: 'driver@example.test', password: 'driver-password', expectedRole: 'driver'
      });

      assert.equal(mismatch.statusCode, 403);
      assert.equal(match.statusCode, 200);
      assert.equal(match.body.user.role, 'driver');
    });

    await t.test('valid admin code creates an admin account', async () => {
      const response = await callController(register, {
        name: 'Admin',
        email: 'admin@example.test',
        password: 'admin-password',
        role: 'admin',
        invitationCode: 'test-admin-code'
      });

      assert.equal(response.statusCode, 201);
      assert.equal(response.body.user.role, 'admin');
    });
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoServer.stop();
    if (originalDriverCode === undefined) delete process.env.DRIVER_SIGNUP_CODE;
    else process.env.DRIVER_SIGNUP_CODE = originalDriverCode;
    if (originalAdminCode === undefined) delete process.env.ADMIN_SIGNUP_CODE;
    else process.env.ADMIN_SIGNUP_CODE = originalAdminCode;
  }
});
