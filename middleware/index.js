// all the middleare goes there
var Trip = require("../models/trip")
var Comment = require("../models/comment")

var middlewareObj = {}
middlewareObj.checkTripOwnership = function(req,res,next){
    if (req.isAuthenticated()){
    
        Trip.findById(req.params.id,function(err,foundTrip){
            if (err || !foundTrip){
                req.flash("error", "Trip not found")
                res.redirect("back")       
            }else{
            // does user own the trip?
            if (foundTrip.author.id.equals(req.user._id)){
                next()
            }else{
                req.flash("error","You don't have permission to do that!")
                res.redirect("back")
            }
            }
         })
    }
    else{
        req.flash("error","You need to be logged in to do that!")
        res.redirect("/login");
    }
}
    

middlewareObj.checkCommentOwnership = function(req,res,next){
    if (req.isAuthenticated()){
        
        Comment.findById(req.params.comment_id,function(err,foundComment){
            if (err || !foundComment){
                res.redirect("back")       
            }else{
            // does user own the comment?
            if (foundComment.author.id.equals(req.user._id)){
                next()
            }else{
                req.flash("error", "You don't have permission to do that!")
                res.redirect("back")
            }
            }
        })
    }
    else{
        req.flash("error","You need to be logged in to do that!")
        res.redirect("/login");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to be logged in to do that!")
    res.redirect("/login")
}

module.exports = middlewareObj