import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Middlewares
import notFoundMiddleware from '@middlewares/notFoundMiddleware';
import errorMiddleware from '@middlewares/errorHandlerMiddleware';

const server: Application = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.use(helmet());

// Routes

// Middlewares
server.all('*', notFoundMiddleware); // 404 Not Found
server.use(errorMiddleware); // Error handler

export default server;
