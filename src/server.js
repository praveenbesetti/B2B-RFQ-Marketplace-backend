import dotenv from 'dotenv';
import app from  './app.js';
import { testDatabaseConnection } from './config/pg.js';
dotenv.config();

const PORT = process.env.PORT || 5000; 

const startServer = async () => {
    try {
        await testDatabaseConnection();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
