const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const toursRoutes = require('./routes/toursRoute');
const usersRoutes = require('./routes/usersRoute');
const reviewsRoutes = require('./routes/reviewsRoute');

// GLOBAL MIDDLEWARES 

// 1 : Security HTTP requests
app.use(helmet());
// 2: secure from noSql injection 
app.use(mongoSanitize());
// 3 : secure from xss 
app.use(xssClean());
// 4 : secure from parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'price',
        'maxGroupSize',
        'difficulty',
        'ratingsAverage',
        'ratingsQuantity',
        'name']
}));
// 5 : limit the requests from the same IP address
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    Max: 50000,
    message: "you have reach the limit of requests from this IP , try again after 5 mins"
});
app.use(limiter);
// 6: console the headers from requests 
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.headers)
    next();
});
// 7: Routes   
app.use('/api/v1/tours', toursRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/reviews', reviewsRoutes);

const DB_connect = process.env.DB_CONNECTION
const port = process.env.PORT
mongoose
    .connect(DB_connect)
    .then(() => console.log('DB connection successful!'))
    .catch((err) => {
        console.error('DB connection error:', err);
        process.exit(1);
    });
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
    

