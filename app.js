require('dotenv').config();

const express = require('express');
const session = require('express-session');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const topicRoutes = require('./routes/topicRoutes'); 

const app = express();
db.connect();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use('/', authRoutes);
app.use('/', topicRoutes); 

app.listen(process.env.PORT || 3000, () => console.log('Server running on port 3000'));