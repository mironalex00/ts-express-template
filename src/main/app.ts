import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Middlewares
import notFoundMiddleware from '@middlewares/NotFoundMiddleware';
import errorMiddleware from '@middlewares/ErrorHandlerMiddleware';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Routes

/// 404 Not Found
app.all('*', notFoundMiddleware);

// Middlewares
app.use(errorMiddleware);

export default app;