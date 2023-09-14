import express from "express";
import mongoose from "mongoose";

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended : true }));
app.set("view engine","ejs");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = {
    email : String,
    password : String,
};

const User = mongoose.model("user",userSchema);

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    const newUser = new User({
        email : req.body["username"],
        password : req.body["password"],
    });

    newUser.save().then(()=>{
        res.render("secrets");
    }).catch((err)=>{
        console.log(err);
    });
});

app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email : username }).then((foundUser)=>{
        if(foundUser) {
            if(foundUser.password === password) {
                res.render("secrets");
            }
        }
    }).catch((err)=>{
        console.log(err);
    });
});

let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}

app.listen(port,()=>{
    console.log(`Server is up and running on ${port} successfully`);
});