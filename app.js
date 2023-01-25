require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.set("strictQuery",false);
mongoose.connect("mongodb://localhost:27017/usersDB",()=>{console.log("Database is running")});

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        require:true
    },
    password:{
        type:String,
        require:true
    }
});

const encKey = process.env.SOME_32BYTE_BASE64_STRING;
const sigKey = process.env.SOME_64BYTE_BASE64_STRING;

userSchema.plugin(encrypt,{encryptionKey: encKey, signingKey:sigKey, encryptedFields:["password"]});

// const secret = "P6bgw8SJc87m+RZFlWDmpeio0LizuXLfX9cTps4k2TI=";
// userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});

const User = mongoose.model("User", userSchema);

app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/login", (req,res)=>{
    res.render("login")
});

app.get("/register",(req,res)=>{
    res.render("register")
});

app.post("/register",(req,res)=>{
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    })
    User.findOne({email:req.body.username},(err,document)=>{
        if(!err){
            if(!document){
                newUser.save(function(err){
                    if(err){
                        console.log(err)
                    }else{
                        res.render("secrets")
                    }
                });
            }
        }
    });
});

app.post("/login",(req,res)=>{
    User.findOne({email:req.body.username},(err,document)=>{
        if(!err){
            if(document){
                if(document.password===req.body.password){
                    console.log(req.body.username)
                    res.render("secrets")
                }
            }
        }else{
            console.log(err)
        }
    });
});

app.listen(3000,()=>{console.log("Server is running on port 3000")});