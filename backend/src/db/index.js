import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
    try {
        console.log('🔗 Attempting to connect to MongoDB Atlas...');
        console.log('📍 Database Name:', DB_NAME);
        
        // MongoDB Atlas connection with proper options
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log(`✅ MongoDB Atlas Connected Successfully!`);
        console.log(`🏠 Host: ${connectionInstance.connection.host}`);
        console.log(`📊 Database: ${connectionInstance.connection.name}`);
        console.log(`🔌 Connection State: ${connectionInstance.connection.readyState}`);
        
    } catch (error) {
        console.error('❌ MongoDB Atlas connection error:', error.message);
        console.error('🔍 Full error:', error);
        
        // Provide helpful error messages
        if (error.message.includes('authentication failed')) {
            console.error('🔑 Authentication failed - check your username and password in MONGODB_URI');
        } else if (error.message.includes('network')) {
            console.error('🌐 Network error - check your internet connection and Atlas cluster status');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('🔍 DNS error - check your cluster URL in MONGODB_URI');
        }
        
        process.exit(1);
    }
}