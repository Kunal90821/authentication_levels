import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import GoogleStrategy from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

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
    googleId : String,
    username : String,
    secret : String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());
// passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id,done){
    User.findById(id).then((user)=>{
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID : process.env.CLIENT_ID,
    clientSecret : process.env.CLIENT_SECRET,
    callbackURL : "http://localhost:3000/auth/google/secrets",
},
function(accessToken,refreshToken,profile,cb){
    User.findOrCreate({ googleId : profile.id, username : profile.name.givenName }, function(err,user){
        return cb(err,user);
    });
}));

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/auth/google",
    passport.authenticate("google",{ scope : ["profile"]})
);

app.get("/auth/google/secrets",
    passport.authenticate("google",{ failureRedirect : "/login" }),
    function(req,res){
        res.redirect("/secrets");
    }
);

app.get("/secrets",(req,res)=>{
    User.find({"secret" : {$ne : null}}).then((foundUsers)=>{
        if(foundUsers) {
            res.render("secrets", { usersWithSecrets : foundUsers});
        }
    }).catch((err)=>{
        console.log(err);
    });
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit",(req,res)=>{
    const submittedSecret = req.body.secret;

    User.findById(req.user.id).then((foundUser)=>{
        if(foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save().then(()=>{
                res.redirect("/secrets");
            });
        }
    }).catch((err)=>{
        console.log(err);
    });
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