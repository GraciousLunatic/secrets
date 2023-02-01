require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require("mongoose-findorcreate");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret: "ThereIsaSecretbutiwontTELLyou",
    resave:false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.set("strictQuery",false);
mongoose.connect("mongodb://localhost:27017/usersDB",()=>{console.log("Database is running")});

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/login", (req,res)=>{
    res.render("login")
});

app.get("/register",(req,res)=>{
    res.render("register")
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/secrets", (req,res)=>{
    User.find({secret:{$ne:null}},(err,usersWithSecrets)=>{
        if(!err){
            res.render("secrets",{secrets:usersWithSecrets})
        }
    })
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
});

app.get("/logout",(req,res)=>{
    req.logout(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect("/");
        }
    });
});

app.post("/register",(req,res)=>{
    User.register({username:req.body.username}, req.body.password, function(err,document){
        if(err){
            console.log(err);
            res.redirect("/")
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            });
        }
    })
});

app.post("/submit", (req,res)=>{
    if(req.isAuthenticated()){
        // console.log(req.body.secret);
        // console.log(req.session.passport.user.id);
        // console.log(req.user);
        User.findById(req.user.id,(err,foundUser)=>{
            if(err){
                console.log(err)
            }else{
                foundUser.secret = req.body.secret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        });
    }else{
        res.redirect("/login")
    }
});

app.listen(3000,()=>{console.log("Server is running on port 3000")});