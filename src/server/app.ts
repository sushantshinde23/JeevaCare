import express from 'express';
import { apiRouter } from './apiRouter.ts';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle with /api prefix
app.use('/api', apiRouter);

// Handle without prefix as well (in case Connect strips it)
app.use('/', apiRouter);
