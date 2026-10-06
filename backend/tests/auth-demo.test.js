const test = require('node:test');
const assert = require('node:assert/strict');

const { getDemoUsers } = require('../demoUsers');

test('demo accounts are available for user, driver and admin roles', async () => {
  const accounts = await getDemoUsers();
  const emails = accounts.map((account) => account.email).sort();

  assert.deepEqual(emails, [
    'admin@rydo.com',
    'driver@rydo.com',
    'user@rydo.com'
  ]);
});
