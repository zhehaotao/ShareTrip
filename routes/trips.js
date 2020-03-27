var express = require("express");
var router = express.Router();
var Trip = require("../models/trip");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var multer = require("multer");
var options = {
  provider: 'mapquest',
  apiKey: process.env.MAPQUEST_API_KEY,
  production: true
}

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dbpa1vvpo',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

var geocoder = NodeGeocoder(options);

var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

var upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

// index route
router.get("/", (req, res) => {
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Trip.find({
      name: regex
    }, function (err, allTrips) {
      if (err) {
        console.log(err);
      } else {
        if (allTrips.length < 1) {
          return res.render("trips/index", {
            trips: allTrips,
            currentUser: req.user,
            error: "No trips match that query, please try again."
          });
        } else {
          res.render("trips/index", {
            trips: allTrips,
            currentUser: req.user
          })
        }
      }
    })
  } else {
    Trip.find({}, function (err, allTrips) {
      if (err) {
        console.log(err);
      } else {
        res.render("trips/index", {
          trips: allTrips,
          currentUser: req.user
        })
      }
    })
  } // res.render("trips",{trips:trips})
});

// create route
router.post("/", middleware.isLoggedIn, upload.single('image'), (req, res) => {
  cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // add cloudinary url for the image to the trip object under image property
    req.body.image = result.secure_url;
    req.body.author = {
      id: req.user._id,
      username: req.user.username
    }
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = req.body.author;
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        console.log(err)
        return res.redirect('back');
      }
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
      var newTrip = {
        name: name,
        price: price,
        image: image,
        description: desc,
        author: author,
        location: location,
        lat: lat,
        lng: lng
      };
      Trip.create(newTrip, function (err, trip) {
        if (err) {
          req.flash('error', err.message);
          res.redirect('back');
        }
        console.log(newTrip);
        res.redirect('/trips/' + trip.id);
      })
    })
  })
});

// new route
router.get("/new", middleware.isLoggedIn, (req, res) => {
  res.render("trips/new")
});

// show route
router.get("/:id", function (req, res) {
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Trip.find({
      name: regex
    }, function (err, allTrips) {
      if (err) {
        console.log(err);
      } else {
        if (allTrips.length < 1) {
          return res.render("trips/index", {
            trips: allTrips,
            currentUser: req.user,
            error: "No trips match that query, please try again."
          });
        } else {
          res.render("trips/index", {
            trips: allTrips,
            currentUser: req.user
          })
        }
      }
    })
  } else {
    Trip.findById(req.params.id).populate("comments likes").exec(function (err, foundTrip) {
      if (err || !foundTrip) {
        req.flash("error", "Trip not found");
        res.redirect("back")
        console.log(err);
      } else {
        res.render("trips/show", {
          trip: foundTrip
        })
      }
    })
  }
});

router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
  Trip.findById(req.params.id, function (err, foundTrip) {
    if (err) {
      console.log(err);
      return res.redirect("/trips");
    }
    // check if req.user._id exists in foundTrip.likes
    var foundUserLike = foundTrip.likes.some(function (like) {
      return like.equals(req.user._id);
    });
    if (foundUserLike) {
      // user already liked, removing like
      foundTrip.likes.pull(req.user._id);
    } else {
      // adding the new user like
      foundTrip.likes.push(req.user);
    }
    foundTrip.save(function (err) {
      if (err) {
        console.log(err);
        return res.redirect("/trips");
      }
      return res.redirect("/trips/" + foundTrip._id);
    })
  })
});

router.get("/:id/edit", middleware.checkTripOwnership, function (req, res) {
  Trip.findById(req.params.id, function (err, foundTrip) {
    res.render("trips/edit", {
      trip: foundTrip
    })
  })
});

router.put("/:id", middleware.checkTripOwnership, upload.single('image'), function (req, res) {

  cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // add cloudinary url for the image to the trip object under image property

    req.body.image = result.secure_url;
    req.body.author = {
      id: req.user._id,
      username: req.user.username
    }
    var name = req.body.trip.name;
    var price = req.body.trip.price;
    var image = req.body.image;
    var desc = req.body.trip.description;
    var author = req.body.author;
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
      var editTrip = {
        name: name,
        price: price,
        image: image,
        description: desc,
        location: location,
        lat: lat,
        lng: lng,
        author: author
      };
      Trip.findByIdAndUpdate(req.params.id, editTrip, function (err, trip) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        console.log(editTrip);
        req.flash("success", "Successfully edited trip!");
        res.redirect('/trips/' + req.params.id);
      })
    })
  })
});

router.delete("/:id", middleware.checkTripOwnership, function (req, res) {
  Trip.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.redirect("/trips");
    } else {
      req.flash("success", "Successfully deleted trip!");
      res.redirect("/trips");
    }
  })
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;