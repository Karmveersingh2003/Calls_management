require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
}).catch(err => console.error(err));