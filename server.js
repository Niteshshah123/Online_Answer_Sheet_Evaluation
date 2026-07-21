require('dotenv').config();
const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const ensureSeed = require('./src/utils/ensureSeed');

(async () => {
  await connectDatabase();
  await ensureSeed();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
})();
