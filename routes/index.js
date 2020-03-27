var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Trip = require("../models/trip");

router.get("/", (req, res) => {
  res.render("landing");
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/register", function (req, res) {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    avatar: req.body.avatar,
    email: req.body.email,
  })
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      req.flash("error", err.message)
      // console.log(err);
      return res.redirect("/register")
    }
    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome to ShareTrip " + user.username + "!")
      return res.redirect("./trips")
    })
  })
});

router.get("/login", function (req, res) {
  res.render("login")
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/trips",
  successFlash: "Welcome to ShareTrip!", //user.username????
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {});

router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "Logged you out!")
  res.redirect("trips")
});

router.get("/users/:id", function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    if (err) {
      req.flash("error", "Something went wrong.");
      return res.redirect("/");
    }
    Trip.find().where('author.id').equals(foundUser._id).exec(function (err, trips) {
      if (err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      res.render("users/show", {
        user: foundUser,
        trips: trips
      })
    })
  })
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login")
};

module.exports = router;