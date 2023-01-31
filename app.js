require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
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
    }
});

userSchema.plugin(passportLocalMongoose);

// const encKey = process.env.SOME_32BYTE_BASE64_STRING;
// const sigKey = process.env.SOME_64BYTE_BASE64_STRING;

// userSchema.plugin(encrypt,{encryptionKey: encKey, signingKey:sigKey, encryptedFields:["password"]});

// const secret = "P6bgw8SJc87m+RZFlWDmpeio0LizuXLfX9cTps4k2TI=";
// userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/login", (req,res)=>{
    res.render("login")
});

app.get("/register",(req,res)=>{
    res.render("register")
});

app.get("/secrets", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets")
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
    // bcrypt.hash(req.body.password, saltRounds, function(err,hash){
    //     const newUser = new User({
    //         username:req.body.username,
    //         password: hash
    //     });
    //     User.findOne({username:req.body.username},(err,document)=>{
    //         if(!err){
    //             if(!document){
    //                 newUser.save(function(err){
    //                     if(err){
    //                         console.log(err)
    //                     }else{
    //                         res.render("secrets")
    //                     }
    //                 });
    //             }
    //         }
    //     });
    // });

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
    // User.findOne({username:req.body.username},(err,document)=>{
    //     if(!err){
    //         if(document){
    //             bcrypt.compare(req.body.password, document.password, function(err, result) {
    //                 if(result ===true){
    //                     res.render("secrets")
    //                 }
    //             });
    //         }
    //     }else{
    //         console.log(err)
    //     }
    // });
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

app.listen(3000,()=>{console.log("Server is running on port 3000")});