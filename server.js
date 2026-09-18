require('dotenv').config();
const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');

(async () => {
  try {
    await connectDatabase();
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
  }
})();

