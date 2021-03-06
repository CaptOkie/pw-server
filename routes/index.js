/*
 * Defines all the different URL routes used to interact with the server.
 */

const express = require('express');
const router = express.Router();
const expLogger = require('../logging/exp-logger');
const syllableParts = require('syllables.json');

// All the different schemes being used in the system.
// Each scheme requires a gen() and a check(raw, stored) function.
const schemes = {
    'text6': { // The control scheme
        gen: function() {

            const max = 36;
            const min = 10;
            var arr = [];
            for (var i = 0; i < 6; ++i) {
                arr.push(((Math.random() * (max - min) + min) | 0).toString(max));
            }
            return arr.join('');
        },
        check: function(raw, stored) {
            return raw === stored;
        }
    },
    'syllable2': { // Our scheme
        gen: function() {

            var arr = [];
            for (var i = 0; i < 2; ++i) {
                var syl = syllableParts.onset[(Math.random() * syllableParts.onset.length) | 0] +
                    syllableParts.nucleus[(Math.random() * syllableParts.nucleus.length) | 0] +
                    syllableParts.coda[(Math.random() * syllableParts.coda.length) | 0];
                arr.push(syl);
            }
            return arr.join('*');
        },
        check: function(raw, stored) {
            return raw === stored.replace(/\*/g, '');
        }
    }
};
const userDB = require('../dbs/user-db')(Object.keys(schemes));

const domains = [ 'Email', 'Facebook', 'Banking' ];
function nextDomain(curr) { return domains[domains.indexOf(curr) + 1]; }

const MAX_ATTEMPTS = 3;

// GETS THE HOME PAGE
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Password Experiment' });
});

// CREATES A NEW USER AND GENERATES PASSWORDS FOR THE USER
router.post('/new-user', function(req, res, next) {

    // Adds a new user to the database.
    userDB.newUser(function(error, user) {

        if (error) throw error;

        // Generates all the password info for each domain.
        const pws = domains.map(function(domain) {
            return {
                userId: user.uid,
                domain: domain,
                password: schemes[user.scheme].gen()
            };
        });
        
        // Adds the passwords to the database.
        userDB.addPasswords(pws, function(error) {

            if (error) throw error;

            res.redirect('/new-user/' + user.uid);
        });
    });
});

// DISPLAYS THE NEW USER'S ID
router.get('/new-user/:userId', function(req, res, next) {
    res.render('new-user', { title: 'Successfully created user!', userId: req.params.userId });
});

// POSTS TO CHECK WHETHER THE PASSWORD IS CORRECT
router.post('/check/:userId/:domain', function(req, res, next) {

    data = {
        userId: req.params.userId,
        domain: req.params.domain
    }

    // Gets the specified user's password information
    userDB.getPwInfo(data, function(error, info) {

        if (error) throw error;
        if (!info) throw 'No record found for UserID=' + req.params.userId + ', Domain=' + req.params.domain;

        // Returns the result to the client
        const result = schemes[info.scheme].check(req.body.password, info.password);
        res.send(result ? undefined : 'Incorrect Password');
    });
});

// POSTS THE USER ID TO START PRACTICING WITH
router.post('/practice', function(req, res, next) {
    res.redirect('/practice/' + req.body.userId + '/' + domains[0]);
});

// GETS THE APPROPRIATE DOMAIN TO PRACTICE
router.get('/practice/:userId/:domain', function(req, res, next) {

    var data = {
        userId: req.params.userId,
        domain: req.params.domain
    };

    // Gets the password information
    userDB.getPwInfo(data, function(error, info) {

        if (error) throw error;
        if (!info) throw 'No record found for UserID=' + req.params.userId + ', Domain=' + req.params.domain;

        data.title = 'Learn your ' + req.params.domain + ' password',
        data.password = info.password,
        data.pwError = req.query.pwError

        // Renders the practice page for the specific scheme and domain.
        res.render('practice-' + info.scheme, data);
    });
});

// POSTS TO THE CURRENT DOMAIN TO CONFIRM THE PASSWORD
router.post('/practice/:userId/:domain', function(req, res, next) {

    var data = {
        userId: req.params.userId,
        domain: req.params.domain
    };

    // Gets the password information
    userDB.getPwInfo(data, function(error, info) {

        if (error) throw error;
        if (!info) throw 'No record found for UserID=' + req.params.userId + ', Domain=' + req.params.domain;

        if (schemes[info.scheme].check(req.body.password, info.password)) {
            const nextDom = nextDomain(data.domain);
            if (nextDom) {
                // Proceeds to the next domain practice.
                res.redirect('/practice/' + data.userId + '/' + nextDom);
            }
            else {
                // Proceeds to the practice complete page.
                res.redirect('/practice/' + data.userId);
            }
        }
        else {
            // Returns to the current domain with an error.
            res.redirect('/practice/' + data.userId + '/' + data.domain + '?pwError=Incorrect Password');
        }
    });
});

// GETS THE PRACTICE COMPLETION PAGE
router.get('/practice/:userId', function(req, res, next) {
    res.render('practice-complete', { title: 'Password practice complete!', userId: req.params.userId });
});

// POSTS TO START THE LOGIN PROCESS
router.post('/login', function(req, res, next) {
    res.redirect('/login/' + req.body.userId + '/' + domains[0]);
});

// GETS THE APPROPRIATE DOMAIN TO LOGIN TO
router.get('/login/:userId/:domain', function(req, res, next) {

    var data = {
        userId: req.params.userId,
        domain: req.params.domain
    };

    // Gets the password info
    userDB.getPwInfo(data, function(error, info) {

        if (error) throw error;
        if (!info) throw 'No record found for UserID=' + req.params.userId + ', Domain=' + req.params.domain;

        data.title = 'Enter your ' + data.domain + ' password';
        data.pwError = req.query.pwError
        data.attemptsLeft = Math.max(0, MAX_ATTEMPTS - info.attemptNum);

        if (data.attemptsLeft <= 0) {

            // Resets the user's attempt count so they aren't locked out
            userDB.resetAttempts(data, function(error) {

                if (error) throw error;

                var nextUrl = '/login/' + data.userId;

                var nextDom = nextDomain(data.domain);
                if (nextDom) {
                    nextUrl += '/' + nextDom;
                }

                // Proceeds to the next domain or the login complete page.
                res.redirect(nextUrl);
            });
        }
        else {
            // Renders the login page for the specific scheme and domain.
            res.render('login-' + info.scheme, data);

            var logData = {
                domain: data.domain,
                user: data.userId,
                scheme: info.scheme,
                mode: 'login',
                event: 'start',
                attempt: info.attemptNum
            };

            // Logs a starting login attempt.
            expLogger(logData);
        }
    });
});

// POSTS TO THE CURRENT DOMAIN TO ATTEMPT THE LOGIN
router.post('/login/:userId/:domain', function(req, res, next) {

    var data = {
        userId: req.params.userId,
        domain: req.params.domain
    };

    // Gets the password information
    userDB.attemptPassword(data, function(error, info) {

        if (error) throw error;
        if (!info) throw 'No record found for UserID=' + req.params.userId + ', Domain=' + req.params.domain;

        const correct = schemes[info.scheme].check(req.body.password, info.password);

        if (correct) {
            const nextDom = nextDomain(data.domain);
            if (nextDom) {
                // Proceeds to the next login page
                res.redirect('/login/' + data.userId + '/' + nextDom);
            }
            else {
                // Proceeds to the login complete page.
                res.redirect('/login/' + data.userId);
            }
        }
        else {
            // Returns the user to the current login page with an error.
            res.redirect('/login/' + data.userId + '/' + data.domain + '?pwError=Incorrect Password');
        }

        var logData = {
            domain: data.domain,
            user: data.userId,
            scheme: info.scheme,
            mode: 'login',
            event: (correct ? 'success' : 'failure'),
            attempt: info.attemptNum
        };
        // Logs the result of the login attempt
        expLogger(logData);
    });
});

// GETS THE LOGIN COMPLETION PAGE
router.get('/login/:userId', function(req, res, next) {
    res.render('login-complete', { title: 'Login Process Complete' });
});

module.exports = router;