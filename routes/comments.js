var express = require("express");
var router = express.Router({mergeParams:true});
var Trip = require("../models/trip")
var Comment = require("../models/comment")
var middleware = require("../middleware")

router.get("/new", middleware.isLoggedIn, function(req,res){
    Trip.findById(req.params.id,function(err,trip){
        if (err){
            console.log(err)
        }else{
            res.render("comments/new",{trip:trip})
        }
    })
})

router.post("/", middleware.isLoggedIn, function(req,res){
    Trip.findById(req.params.id, function(err, trip){
        if (err){
            res.flash("error", "Something went wrong")
            console.log(err);
            res.redirect("/trips")
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if (err){
                    console.log(err);
                }else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save()
                    trip.comments.push(comment)
                    trip.save()
                    req.flash("success", "Successfully added comment!")
                    res.redirect('/trips/'+trip._id);
                }
            })
        }   
    })
})

router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Trip.findById(req.params.id, function(err, foundTrip){
        if (err || !foundTrip) {
            req.flash("error", "No trip found");
            return res.redirect("back");
        }
    })
    Comment.findById(req.params.comment_id, function(err, foundComment){
       if(err){
           res.redirect("back");
       } else {
         res.render("comments/edit", {trip_id: req.params.id, comment: foundComment});
       }
    });
 });

router.put("/:comment_id", middleware.checkCommentOwnership, function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
        if (err){
            res.redirect("back")
        }else{
            req.flash("success", "Successfully edited comment!")
            res.redirect("/trips/"+req.params.id)
        }
    })
})

router.delete("/:comment_id",middleware.checkCommentOwnership, function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
        if(err){
            res.redirect("back")
        }else{
            req.flash("success", "Successfully deleted comment!")
            res.redirect("/trips/" + req.params.id)
        }
    })
})

module.exports = router