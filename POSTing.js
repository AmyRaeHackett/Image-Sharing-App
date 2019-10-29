"use strict";

//variables
var express = require("express");
var port = 9035;
var app = express();
var bodyParser = require("body-parser");
var fileUpload = require("express-fileupload");
var session = require("express-session");
var mysql = require("mysql");

var options = {year: 'numeric', month: 'long', day: 'numeric'}; //changing date to a desired format
var dateNew = new Date();
var date = dateNew.toLocaleDateString("en-UK", options);


//SQL FILES
//configure database
//made locally using MAMP
var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "hacketam_db"
});


// connect to the DB
conn.connect(function (err) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log("Successfully connected to DB");
    }
});


//app.use
app.use(express.static("staticDirectory"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());
app.use(session({
    secret: "rufgbui84g3tfjehfruieftry5u^&reuir",
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60000}
}));

//app.set
app.set("view-engine", "ejs");
app.set("views", "templateDirectory");


//homepage
app.get("/", function (req, res) {
    var user = req.session.data; //for checking if user is logged in

    if (user) {
        res.render("homepage.ejs", {
            "data": "/profile", //redirecting to profile page or login page depending on whether you're logged in
            "option": "Profile page", //labelling the profile page or login page
            "log": "/logout",
            "option2": "Logout"
        }) // having a login/logout button depending on if you're logged in or out
    }
    else {
        res.render("homepage.ejs", {
            "data": "/login.html",
            "option": "Login",
            "log": "http://localhost:9035/login.html",
            "option2": "Login"
        });
    }

});


//posting the user's login credentials, redirecting to profile page
app.post("/login", function (req, res) {

    //user's credentials
    var user = req.body.username;
    var pass = req.body.password;

    //SQL
    var sql = `SELECT * FROM users WHERE username = '${user}' AND password = '${pass}'`;

    conn.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                //storing username in session cookie
                req.session.data = user;

                //redirecting to user's profile page once they're logged in
                res.redirect("/profile");
            }

            else {
                //if the incorrect username and password are entered, redirect to ejs file which notifies the user that their username or password are wrong
                res.json("Wrong username or password.");
            }
        }
    });
});

//registering for a new account
app.post("/register", function (req, res) {
    var user = req.session.data;
    req.session.destroy(); //destroy session - attempting to register will automatically log you out if you are currently logged in to another account.
    var username = req.body.username;
    var firstname = req.body.firstname;
    var surname = req.body.surname;
    var password = req.body.password;
    var password2 = req.body.password2;

    //SQL
    var sql1 = `SELECT * FROM users`; //used to check if username exists in database
    var sql = `INSERT INTO users (username, firstname, surname, password) VALUES ("${username}", "${firstname}", "${surname}", "${password}")`;

    conn.query(sql1, function (err, results) {

            if (err) {
                res.send("A database error occurred: " + err);
            } else {

                //can't enter username if it already exists in database
                for (var i in results) {

                    if (username === results[i].username) {

                        res.json("Username taken.");
                        return; //stops code so that the next if statement isn't called because that will result in an error - two res.jsons can't be called
                    }
                }


                //regular expressions
                var regex1 = new RegExp(/[A-Za-z]/); //capital letters or lowercase letters only
                var regex2 = new RegExp(/[A-Za-z0-9_-]{6,15}/); //letters of numbers or _ or -
                var regex3 = new RegExp(/(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!_@~#?]){6,25}/); //must contain one lowercase, one uppercase, one number and one special character

                if (password2 !== password) {
                    res.json("Passwords do not match.");
                    console.log(password2, password);
                    return;

                }

                if (!regex2.test(username)) {
                    res.json("Username must be between 6-15 characters and contain only letters, numbers, underscores or dashes.");
                    return;
                }

                if (!regex1.test(firstname)) {
                    res.json("Firstname must only contain letters.");
                    return;
                }

                if (!regex1.test(surname)) {
                    res.json("Surname must only contain letters.");
                    return;
                }

                if (!regex3.test(password)) {
                    res.json("Password must be between 6-25 characters and contain only: one lowercase letter, one uppercase letter, one number and one of the following: !_@~# ");

                }

                //if all fields are okay then insert the user info into SQL database
                else {
                    conn.query(sql, function (err, results2) {
                        if (err) {
                            res.send("A database error occurred: " + err);
                        } else {
                            res.json("Thank you for registering, you can now login!")
                        }
                    })
                }
            }
        }
    );


});

//profile page - welcoming the user and allowing them to upload files
app.get("/profile", function (req, res) {
    var user = req.session.data;

    //if the user is logged in
    if (user) {
        res.render("profile.ejs", {"username": user})
    }

    //if the user is not logged in and tries to access this page
    else {
        res.render("noPage.ejs");
    }

});

//logout function
app.get("/logout", function (req, res) {
    //delete req.session.data;
    req.session.destroy();
    res.redirect("/");
});


//posting the user's file upload and rendering the explore page when it's done
app.post("/upload", function (req, res) {
    var user = req.session.data;
    var file = req.files.myimage;
    var likes = 0; //setting likes value to zero as it has not been liked yet

    //SQL
    var sql = `INSERT INTO images (username, filename, date, likes ) VALUES ("${user}", "${file.name}", "${date}", "${likes}") `;
    var sql2 = `SELECT * FROM images `;

    if (user) {
        conn.query(sql, function (err, results) {
                if (err) {
                    res.send("A database error occurred: " + err);
                } else {
                    file.mv("staticDirectory/uploads/" + file.name);
                }
            }
        );

        conn.query(sql2, function (err, results) {
            if (err) {
                res.send("A database error occurred: " + err);
            } else {

                res.render("welcome.ejs", {
                    "results": results,
                    "message": "File successfully uploaded.",
                    "log": "/logout",
                    "option": "Logout"
                })
            }
        })
    }
    else {
        res.render("upload.ejs", {"upload": "You must be logged in to upload an image."})
    }
});


//viewing explore page as a grid
app.get("/explore", function (req, res) {
    var user = req.session.data;
    var sql2 = `SELECT * FROM images `;

    conn.query(sql2, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {

            if (user) {
                res.render("welcome.ejs", {
                    "results": results,
                    "message": " ",
                    "log": "/logout",
                    "option": "Logout"
                })
            }

            else {
                res.render("welcome.ejs", {
                    "results": results,
                    "message": " ",
                    "log": "http://localhost:9035/login.html",
                    "option": "Login"
                })
            }
        }
    })
});

//viewing explore page so that you can see image details
app.get("/explore2", function (req, res) {
    var user = req.session.data;
    var sql2 = `SELECT * FROM images `;

    conn.query(sql2, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {

            if (user) {
                res.render("explore2.ejs", {
                    "results": results,
                    "log": "/logout",
                    "option": "Logout"
                })
            }

            else {
                res.render("explore2.ejs", {
                    "results": results,
                    "log": "http://localhost:9035/login.html",
                    "option": "Login"
                })
            }
        }
    })


});

//viewing individual image pages and showing comments with SQL
app.get("/image/:id", function (req, res) {
    var input = req.params.id;
    console.log(input);
    var user = req.session.data;
    var sql = `SELECT * FROM images WHERE id = "${input}"`;
    var sql2 = `SELECT * FROM commentsnew WHERE image = "${input}"`;

    conn.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            conn.query(sql2, function (err, results2) {
                if (err) {
                    res.send("A database error occurred: " + err)
                } else {

                    //if logged in (for button)
                    if (user) {
                        res.render("individualUpload.ejs", {
                            "id": input,
                            "log": "logout",
                            "option": "Logout",
                            "images": results[0],
                            "comments": results2

                        })
                    }
                    //if not logged in (for button)
                    else {
                        res.render("individualUpload.ejs", {
                            "id": input,
                            "log": "login.html",
                            "option": "Login",
                            "images": results[0],
                            "comments": results2
                        })

                    }
                }
            })
        }
    });

});

//ADDING A COMMENT and SHOWING IT (WITH AJAX)
//use parameterised query to prevent SQL attack???? using ?, ["${comment}"] ?? not sure how - sorry!
app.post("/comment/:id", function (req, res) {
    var user = req.session.data;
    var comment = req.body.comment;
    var image = req.params.id; //id no. of image you're posting to

    var sql = `INSERT INTO commentsnew (comment, username, date, image) VALUES ("${comment}", "${user}", "${date}", "${image}") `;
    var sql2 = `SELECT * FROM commentsnew WHERE image = "${image}" `;
    console.log("SQL: " + sql);

    //must be logged in to post a comment
    //comment must not be an empty string (including a string of just white space)
    if (user === false || typeof comment === 'undefined' || !comment || comment.length === 0 || comment === ""
        || !/[^\s]/.test(comment) || /^\s*$/.test(comment) || comment.replace(/\s/g, "") === "" ) {
        res.json("Please login and/or insert a valid comment.");
        console.log("Empty string");
    }


    else if (user) {
        conn.query(sql, function (err, results) {
                if (err) {
                    res.send("A database error occurred: " + err);
                } else {
                    console.log("Comment posted.");
                }
            }
        );

        conn.query(sql2, function (err, results2) {
            if (err) {
                res.send("A database error occurred: " + err)
            } else {

                for (var i in results2) {
                    var comments = results2[i].comment;
                    var user = results2[i].username;
                    var commentDate = results2[i].date;
                }

                var comments2 = [
                    {
                        "comments": comments,
                        "user": user,
                        "date": commentDate
                    }
                ];

                res.json(comments2);

            }
        })
    }


});

//LIKES
app.post("/like/:id", function (req, res) {
    var user = req.session.data;
    var input = req.params.id;

    var sql = `UPDATE images SET likes	= likes+1 WHERE id = ("${input}")  `;
    var sql2 = `SELECT likes FROM images WHERE id = ("${input}")`;

    if (user) {
        conn.query(sql, function (err, results) {

            if (err) {
                res.send("A database error occurred: " + err);
            }

            else {
                conn.query(sql2, function (err, results) {
                    if (err) {
                        res.send("A database error occurred: " + err);
                    }
                    else {
                        var likes = results[0].likes;
                        res.json(likes + " likes")
                    }
                })
            }
        })
    }

    else {
        res.json("Please login to like images.");
    }
});

//viewing images uploaded by specific users
app.get("/user/:id", function (req, res) {
    var input = req.params.id;
    var user = req.session.data;

    var sql = `SELECT * FROM images WHERE username = "${input}"`;

    conn.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err)

        } else {

            //if logged in (for login/logout button)
            if (user) {
                res.render("user.ejs", {
                    "id": input,
                    "log": "/logout",
                    "option": "Logout",
                    "images": results,


                })
            }
            //if not logged in (for button)
            else {
                res.render("user.ejs", {
                    "id": input,
                    "log": "/login.html",
                    "option": "Login",
                    "images": results,

                })

            }

        }


    })
});


app.listen(port);
console.log("Server running on http://localhost:" + port);