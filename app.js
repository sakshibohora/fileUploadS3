import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import apiRoutes from './routes/apiRoutes';
import errorHandler from './helper/errorHandler';

dotenv.config();
const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(cors());
app.use(bodyParser.json());

app.use('/api', apiRoutes);
app.use(errorHandler);

module.exports = app;


