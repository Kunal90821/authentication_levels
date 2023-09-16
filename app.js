import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended : true }));
app.set("view engine","ejs");

app.use(session({
    secret : "Our little secret.",
    resave : false,
    saveUninitialized : false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(`mongodb://${process.env.HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());
// passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

app.post("/register",(req,res)=>{
    User.register({username : req.body["username"]}, req.body["password"], (err,user)=>{
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});
let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}

app.listen(port,()=>{
    console.log(`Server is up and running on ${port} successfully`);
});