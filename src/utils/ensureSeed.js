const seedData = require('./seedData');

async function ensureSeed() {
  await seedData();
}

module.exports = ensureSeed;
