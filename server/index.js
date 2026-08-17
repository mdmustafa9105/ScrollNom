import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import foodOnFriendRoutes from './routes/foodOnFriendRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import opsRoutes from './routes/opsRoutes.js';
import discoveryRoutes from './routes/discoveryRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import path from 'path';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration allowing LAN origins for Three-Laptop Demonstration
app.use(cors({
  origin: true, // Allow all origin reflections on local Wi-Fi LAN
  credentials: true
}));

// Serve static uploaded media files & creator video folders
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use('/Go_cool_Bengaluru', express.static(path.join(process.cwd(), 'Go_cool_Bengaluru')));

// Increase JSON body limit to 50MB for video uploads
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', userRoutes);
app.use('/api', contentRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', discoveryRoutes);
app.use('/api', deliveryRoutes);
app.use('/api', opsRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', foodOnFriendRoutes);
app.use('/api', collaborationRoutes);
app.use('/api', uploadRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);
app.use('/api', webhookRoutes);


// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` }
  });
});

// Global Error Middleware
app.use(errorHandler);

// Start Server on 0.0.0.0 to listen across local network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 ScrollNom Backend API Running on 0.0.0.0:${PORT}`);
  console.log(`💻 ScrollNom Frontend → http://localhost:3000`);
  console.log(`🔌 ScrollNom API → http://localhost:5000`);
  console.log(`🩺 Health Check → http://localhost:5000/api/health`);
  console.log(`🌐 LAN Demonstration Mode Active (Accessible via Local IP)`);
  console.log(`🗄️ Shared Persistent Database: SQLite (scrollnom.db)`);
  console.log(`🚴 Delivery Engine: ScrollNom Adapter Active`);
  console.log(`🔒 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID || 'Configured'}`);
  console.log(`📧 Resend Email API Key: ${process.env.RESEND_API_KEY ? 'Active' : 'Dev Fallback'}`);
  console.log(`==================================================`);
});
