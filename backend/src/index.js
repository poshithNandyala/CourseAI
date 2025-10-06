import dotenv from 'dotenv';
import { connectDB } from "./db/index.js";
import {app} from './app.js'

// Load environment variables first
dotenv.config({
    path: '.env'
})

// Log environment status
console.log('🔧 Environment Variables Status:')
console.log('- PORT:', process.env.PORT || '8000')
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing')
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:5173')
console.log('- ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '✅ Set' : '❌ Missing')

connectDB()
    .then(() => {
        const port = process.env.PORT || 8000;
        
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`📡 API Base URL: http://localhost:${port}/api/v1`);
            console.log(`🏥 Health Check: http://localhost:${port}/health`);
            console.log('✅ Backend is ready to accept requests!');
        });
        
        // Handle server errors
        app.on('error', (error) => {
            console.error('❌ Server error:', error);
        });
    })
    .catch((err) => {
        console.log('❌ MongoDB connection failed:', err);
        process.exit(1);
    });