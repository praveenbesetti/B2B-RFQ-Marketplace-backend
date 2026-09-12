import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import errorMiddleware from './middleware/error.middleware.js';
import rfqRoutes from './routes/rfq.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import { createApiError } from './utils/ApiError.js';
const app = express();
 
app.use(express.json());

app.use(cors({
        origin:process.env.CLIENT_ORIGIN,
    }
));
app.use(helmet());
app.use(morgan('dev'));

app.use(cookieParser());


app.post('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy' });
});
app.use('/api/auth', authRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);

// Unmatched routes
app.use((req, res, next) => {
  next(createApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});


app.use(errorMiddleware);

export default app;


