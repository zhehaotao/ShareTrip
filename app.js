require('dotenv').config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var User = require("./models/user");
var Comment = require("./models/comment");
var Trip = require("./models/trip");
var seedDB = require("./seeds");

// require routes
var commentRoutes = require("./routes/comments");
var tripRoutes = require("./routes/trips");
var indexRoutes = require("./routes/index");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

var url = process.env.DATABASEURL || "mongodb://localhost:27017/share_camp";
mongoose.set('useUnifiedTopology', true);
mongoose.connect(url, {
  useNewUrlParser: true,
  useCreateIndex: true
}).then(() => {
  console.log('Connected to DB');
}).catch(err => {
  console.log('ERROR:', err.message);
});

process.env.databaseURL;

mongoose.set('useFindAndModify', false);

// seedDB();
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.locals.moment = require("moment");

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/trips", tripRoutes);
app.use("/trips/:id/comments", commentRoutes);

app.listen(process.env.PORT || 3000, process.env.IP, function () {
  console.log("hi")
});