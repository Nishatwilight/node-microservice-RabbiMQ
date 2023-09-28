const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 7070;
const mongoose = require("mongoose");
const user = require("./user");
const jwt = require("jsonwebtoken")
app.use(express.json());

mongoose.connect('mongodb://localhost/auth-service')
    .then(() => {
        console.log('Auth-Service Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
// Register
app.post("/auth/register", async (req, res)=>{
 const {name, email, password} = req.body;

 const userExists = await user.findOne({email});
 if(userExists){
  return res.json({message: "User is Already Exits"})
 } else{
  const newUser = new user({
   name,
   email,
   password
  })
  newUser.save()

  return res.send(newUser);
 }
})

// Login
app.post("/auth/login", async(req, res)=>{
 const {email, password} = req.body;
 const User = await user.findOne({email})
 console.log('User', User);
 if(!User){
  return res.json({message: "User doesn't exist"});
 } else{
// Check if the entered password is valid.
if (password !== User.password){
 return res.json({message: "Password is Incorrect"})
}
  const payload ={
   email,
   name: user.name
  }
  jwt.sign(payload, "secret", (err, token)=>{
   if (err) console.log(err);
   else{
    return res.json({token: token})
   }
  })
 }
})

app.listen(PORT, ()=>{
 console.log(`Auth-Service at ${PORT}`);
})