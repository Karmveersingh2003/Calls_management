const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '6mb' })); // room for base64 company logos
app.use(morgan('dev'));

// Root / health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Call Management API is running',
  });
});


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/masters', require('./routes/masterRoutes'));
app.use('/api/admin-calls', require('./routes/adminCallRoutes'));
app.use('/api/guest-calls', require('./routes/guestCallRoutes'));
app.use('/api/import-export', require('./routes/importExportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;
