const bcrypt = require('bcryptjs');

const demoAccounts = [
  {
    name: 'Demo User',
    email: 'user@rydo.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'Demo Driver',
    email: 'driver@rydo.com',
    password: 'driver123',
    role: 'driver'
  },
  {
    name: 'Demo Admin',
    email: 'admin@rydo.com',
    password: 'admin123',
    role: 'admin'
  }
];

async function getDemoUsers() {
  return Promise.all(
    demoAccounts.map(async (account) => ({
      ...account,
      password: await bcrypt.hash(account.password, 10)
    }))
  );
}

module.exports = { demoAccounts, getDemoUsers };