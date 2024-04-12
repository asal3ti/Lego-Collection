const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
let Schema = mongoose.Schema;
require('dotenv').config();
// define the user schema
const userSchema = new Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: { type: Date, default: Date.now },
        userAgent: String
    }]
});

// initialize function
function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);
        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}


// register user
function registerUser(userData) {
    return new Promise(function(resolve, reject) {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10)
                .then((hashedPassword) => {
                    let newUser = new User({
                        userName: userData.userName,
                        password: hashedPassword,
                        email: userData.email
                    });
                    newUser.save()
                        .then(() => {
                            resolve();
                        })
                        .catch(err => {
                            if (err.code === 11000) {
                                reject("User Name already taken");
                            } else {
                                reject("There was an error creating the user: " + err);
                            }
                        });
                })
                .catch(err => {
                    reject("There was an error encrypting the password");
                });
        }
    });
}


// checkUser
function checkUser(userData) {
    return new Promise(function(resolve, reject) {
        User.findOne({ userName: userData.userName })
            .then(user => {
                if (!user) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    bcrypt.compare(userData.password, user.password)
                        .then((result) => {
                            if (result) {
                                let loginHistory = user.loginHistory || [];
                                if (loginHistory.length === 8) {
                                    loginHistory.pop();
                                }
                                loginHistory.unshift({ dateTime: new Date().toString(), userAgent: userData.userAgent });

                                User.updateOne({ userName: user.userName }, { $set: { loginHistory: loginHistory } })
                                    .then(() => {
                                        resolve(user);
                                    })
                                    .catch(err => {
                                        reject("There was an error updating the login history: " + err);
                                    });
                            } else {
                                reject("Incorrect Password for user: " + userData.userName);
                            }
                        })
                        .catch(err => {
                            reject("There was an error comparing passwords: " + err);
                        });
                }
            })
            .catch(err => {
                reject("Unable to find user: " + userData.userName);
            });
    });
}


let User = mongoose.model('User', userSchema);
module.exports = {User, registerUser, checkUser, initialize};
