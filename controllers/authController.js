const User = require('../models/User');

// Show register page
const getRegister = (req, res) => {
    res.render('register', { error: null });
};

// Handle register form submission
const postRegister = async (req, res) => {
    try {
        console.log('Register attempt:', req.body);
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        console.log('Existing user check done');
        if (existingUser) {
            return res.render('register', { error: 'Email already registered' });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Redirect to login
        res.redirect('/login');
    } catch (err) {
        console.log('Register error NAME:', err.name);
        console.log('Register error MESSAGE:', err.message);
        console.log('Register error FULL:', err);
        res.render('register', { error: err.message });
    }
};

// Show login page
const getLogin = (req, res) => {
    res.render('login', { error: null });
};

// Handle login form submission
const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Save user to session
        req.session.userId = user._id;
        req.session.username = user.username;

        // Redirect to dashboard
        res.redirect('/dashboard');
    } catch (err) {
        console.log('Register error:', err);
        res.render('login', { error: 'Something went wrong' });
    }
};

// Handle logout
const logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};

module.exports = { getRegister, postRegister, getLogin, postLogin, logout };