import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import itemRoutes from './routes/itemRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Al-Quran Kareem MERN API',
  });
});

// Main API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 MERN Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
