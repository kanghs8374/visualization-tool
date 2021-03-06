
const express = require('express');
const favicon = require('express-favicon');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PUBLIC = path.join(__dirname, 'public');
const VIEWS = path.join(__dirname, 'views');
const FAVICON = favicon(`${__dirname}/public/favicon.ico`);

app.set('views', VIEWS);
app.set('view engine', 'ejs');

app.all('/*', require('./middleware/cors'));

app.use(FAVICON);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(PUBLIC));


app.use('/', require('./routes/index'));
app.use('/salt/v1/map', require('./routes/map'));
app.use('/salt/v1/statistics', require('./routes/statistics/index'));
app.use('/salt/v1/junction/', require('./routes/junction'));
app.use('/salt/v1/signal/jsontoxml/', require('./routes/signal'));
app.use('/salt/v1/status', require('./routes/simulation-status'));

app.use('/salt/v1/simulation', require('./routes/simulation-result'));
app.use('/salt/v1/simulations', require('./routes/simulations'));

app.use('/salt/v1/optimization', require('./routes/optimization'));

app.use(require('./middleware/not-found'));
app.use(require('./middleware/server-error'));

module.exports = app;
