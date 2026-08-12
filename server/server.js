const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'active', message: 'LabFlow CMS Backend is online' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`⚡ LabFlow CMS Backend running on port ${PORT}`);
});
