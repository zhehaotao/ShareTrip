var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user")


router.get("/",(req,res)=>{
    res.render("landing");
});


router.get("/register", function(req,res){
    res.render("register")
})

router.post("/register",function(req,res){
    var newUser = new User({username:req.body.username})
    User.register(newUser,req.body.password, function(err,user){
        if (err){
            req.flash("error", err.message)
            // console.log(err);
            return res.redirect("/register")
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Welcome to ShareTrip " + user.username + "!")
            return res.redirect("./trips")
        })
    })
})

router.get("/login",function(req,res){
    res.render("login")
})

router.post("/login",passport.authenticate("local", {
    successRedirect:"/trips",
    successFlash:"Welcome to ShareTrip!",    //user.username????
    failureRedirect:"/login",
    failureFlash: true
}), function(req,res){
});

router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out!")
    res.redirect("trips")
});

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
}

module.exports = router