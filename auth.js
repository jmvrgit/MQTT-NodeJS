module.exports = function(app) {

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

// Configure session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure passport
passport.use(new LocalStrategy(
    function(username, password, done) {
        if (username === 'admin' && password === 'password123') {
            return done(null, { id: 1, username: 'admin' });
        } else {
            return done(null, false, { message: 'Incorrect credentials.' });
        }
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    if (id === 1) {
        done(null, { id: 1, username: 'admin' });
    } else {
        done(new Error('User not found'));
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect('/login');
}

return {
    ensureAuthenticated,
};
};