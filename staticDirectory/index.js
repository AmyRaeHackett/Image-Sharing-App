"use strict";


//posting comments
function commentFunction(id) {
    var commentForm = $(".commentForm");
    console.log("The comment is: " + commentForm.val());
    $.ajax(
        console.log("The ID is: " + id),
        {
            url: "http://localhost:9035/comment/" + id,
            data: {comment: commentForm.val()},
            type: "POST",

            success: function (result) {

                //if input isn't empty
                if (commentForm.val() !== "") {
                    $("#login").hide();

                    for (var i in result) {
                        var row = document.createElement("tr");
                        var cell1 = document.createElement("td");
                        var cell2 = document.createElement("td");


                        //if input had only spaces in it, the username and date would print saying undefined
                        //so this if statement stops it from printing anything
                        //it was to do with the statement I used in my server-side (statement wouldn't work here for some reason?)
                        //user and date appear as undefined when there is only white space in the comment field so it checks for that
                        if (result[i].user === undefined || result[i].date === undefined) {
                            $("#login").show();
                            $("#login").text(result);
                        }

                        else {
                            $(cell1).html("<b>" + result[i].user + "</b>" + "<br>" + result[i].date);
                            $(cell2).text(result[i].comments).css({
                                "backgroundColor": "rgba(255,255,255, 0.2)",
                                "width": "400px"
                            });
                            $(cell1).appendTo(row);
                            $(cell2).appendTo(row);
                            $(row).prependTo($("#commentTable"));
                            console.log(result);
                        }

                    }
                }

                //if the user isn't logged in and/or they try to post an empty comment
                else {


                    $("#login").show();
                    $("#login").text(result);
                }

            },

            error: function (err) {
                console.log("error" + err)

            }
        }
    );
}

//posting likes
function likeFunction(id) {
    console.log("The ID is: " + id);
    $.ajax({
        url: "http://localhost:9035/like/" + id,
        type: "POST",
        success: function (result) {
            console.log(result);
            $("#likes").html(result);
        },

        error: function (err) {
            console.log("error" + err)

        }

    });
}

//checking if username exists
function userExists() {
    var check = $("#nameCheck");
    $.ajax({
        url: "http://localhost:9035/register",
        type: "POST",
        data: {
            username: check.val(),
            firstname: $("#firstname").val(),
            surname: $("#surname").val(),
            password: $("#password").val(),
            password2: $("#password2").val()
        },
        success: function (result) {
            $("#exists").text(result);
            console.log(result);

        },
        error: function (err) {
            console.log("error" + err)

        }

    })
}

//checking that login information is correct
function login() {
    $.ajax({
        url: "http://localhost:9035/login",
        type: "POST",
        data: {
            username: $("#username").val(),
            password: $("#password").val()
        },

        success: function (result) {


            //if user enters a wrong username or password, notify them
            if (result === "Wrong username or password.") {
                $("#wrong").text(result);
            }

            //if username and password are correct, redirect to homepage
            else {
                window.location.replace("/profile");

            }


        },
        error: function (err) {
            console.log("error" + err)

        }

    })
}