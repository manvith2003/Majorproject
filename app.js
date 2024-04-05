if(process.env.NODE_ENV!="production"){
  require('dotenv').config();
}

console.log(process.env.SECRET_KEY);
const nodemailer = require("nodemailer");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 3000;
const Listing = require("./models/listing.js");
const path = require("path");
const methodOveride= require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync =require("./utils/wrapAsync.js");
const ExpressError =require("./utils/ExpressError.js");
const Joi = require('joi');

const {listingSchema,reviewSchema}  =require("./models/schema.js");
const Review = require("./models/review.js");
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport =require("passport");
const LocalStratergy =require("passport-local");
const  User =require("./models/user.js");
const {isLogged, saveRedirectUrl,isOwner,validateListing,validatereview, isAuthor} =require("./middleware.js");
const multer  = require('multer');
const {storage}=require("./cloudConfig.js");
const upload = multer({ storage });

const DB_URL = process.env.ATLAS_URL;

main()
  .then((res) => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

  async function main() {
    //   await mongoose.connect(MONGO_URL);
    await mongoose.connect(DB_URL);
  }


  const store = MongoStore.create({
    mongoUrl: DB_URL,
    clientPromise,
    crypto: {
      secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
  });
  
  store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE");
  });

  store.on("error",()=>{
    console.log("Error in mongo session",err);
  });

  let sessionOption = {
     store,
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie:{
            expires:Date.now()+7*24*60*60*1000,
            maxAge:7*24*60*60*1000,
            httpOnly :true,
        }
      }

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'manvith131250@gmail.com',
          pass: 'omnm ylsl pexe yjgp'
        }
      });
      
      

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOveride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.use(cookieParser());
app.use(cookieParser("secretcode"));

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.sucess =req.flash("sucess");
  res.locals.error =req.flash("error");
  res.locals.currUser=req.user;
  next();
});


//signup route
app.get("/signup",(req,res)=>{
   res.render("users/signup.ejs");
})

//post signup route
app.post("/signup",wrapAsync(async(req,res)=>{
  try{
    let {username ,email ,password} =req.body;
   const newUser =new User({username,email});
    const regUser=  await User.register(newUser,password);

    var mailOptions = {
      from: 'manvith131250@gmail.com',
      to: `${email}`,
      subject: 'Welcome to Wanderlust!.',
      text: ' Prepare for a journey of discovery and adventure. From stunning landscapes to vibrant cultures, there so much to explore. If you need any assistance along the way. Happy travels!'
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
      
    req.login(regUser,(err)=>{
      if(err){
        next(err);
      }
      req.flash("sucess","Welcome to Wanderlust !!");
      res.redirect("/listings");
    }); 
  }
  catch(err){
    req.flash("error",err.message);
    res.redirect("/signup");
  }
}))


//login route

app.get("/login",(req,res)=>{
  res.render("users/login.ejs");
});

app.post('/login', saveRedirectUrl,
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  async(req, res) => {
    req.flash("sucess", "You are logged successfully into Wanderlust!!");
    let redUrl =res.locals.redirectUrl || "/listings";
    res.redirect(redUrl);
  }
);


//logout route
app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
      if(err){
        return next(err);
      }
      req.flash("sucess","You are Looged Out");
      res.redirect("/listings");
    });
});

//index route
app.get("/listings", wrapAsync(async (req, res) => {
  const list = await Listing.find({}); 
  res.render("listings/index.ejs", { list });
}));
 

//new route
app.get("/listings/new",isLogged, (req, res) => {   
    res.render("listings/new.ejs");
});


// create route
app.post("/listings", upload.single('listing[image]'), isLogged, validateListing, wrapAsync(
  async (req, res, next) => {
       
      let url = req.file.path; // Set the url variable
      let filename = req.file.filename; // Set the filename variable
      
      const newlist = new Listing(req.body.listing);
      newlist.owner = req.user._id;
      newlist.image = { url, filename }; // Assign url and filename to newlist.image
      await newlist.save();
      req.flash("success", "New listing created successfully!!");
      res.redirect("/listings");
  }
));

//show route
app.get("/listings/:id",wrapAsync( async (req, res) => {
  let { id } = req.params;
  const listId = await Listing.findById(id).populate({
    path:"reviews",
    populate:{
      path:"author",
    },
  }).populate("owner");
  if(!listId){
    req.flash("error","Listings you requested for doesn't exist ");
    res.redirect("/listings");
  }
  console.log(listId)
  res.render("listings/show.ejs", { listId });
}));


//filter route 
app.get("/listings/filter/:id",wrapAsync(async(req,res)=>{
  let { id } = req.params;
	let list  = await Listing.find({ category: { $all: [id] } });

	if (list .length != 0) {
		res.locals.success = `Listings Find by ${id}`;
		res.render("listings/index.ejs", { list});
	} else {
		req.flash("error", "Listings is not here !!!");
		res.redirect("/listings");
	}     
}));


//edit route
app.get("/listings/:id/edit",isLogged,isOwner,wrapAsync(async(req,res)=>{
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error","Listings you requested for doesn't exist ");
      res.redirect("/listings");
    }
    let blurImage =listing.image.url;
    blurImage=blurImage.replace("/upload","/upload/w_250");
    
    res.render("listings/edit.ejs", { listing ,blurImage });
}));


//update route
app.put("/listings/:id", isLogged ,upload.single('listing[image]'),isOwner,validateListing,wrapAsync(async (req, res) => {
    let { id } = req.params;
   let listing= await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    let url = req.file.path; // Set the url variable
    let filename = req.file.filename; // Set the filename variable
    listing.image={ url, filename };
    await listing.save();

    req.flash("sucess","Updated listings successfully !!");
    res.redirect(`/listings/${id}`);
}));


//delete route
app.delete("/listings/:id",isLogged,isOwner,wrapAsync(async(req,res)=>{
    let { id } = req.params;
    await Listing.findByIdAndDelete(id)
    req.flash("sucess","Deleted successfully!!");
    res.redirect("/listings")
}));


//post review route
app.post("/listings/:id/reviews",isLogged,validatereview,wrapAsync(async(req,res)=> {
    let {id} =req.params;
    let listing =await Listing.findById(id);
    let newReview = new Review(req.body.review);
    newReview.author=req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("sucess","new review added successfully");
    res.redirect(`/listings/${listing._id}`);

}));


// delete review  route
app.delete("/listings/:id/reviews/:reviewId",isLogged,isAuthor, wrapAsync(async(req,res)=>{
    let {id,reviewId} =req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("sucess","Review Deleted successfully !!");
    res.redirect(`/listings/${id}`);
}));


//all error
app.all('*',(req,res,next)=>{
    next(new ExpressError(404 ,"Page Not Found !!!"));
});


//middelware
app.use((err,req,res,next)=>{
    let {statusCode="500" ,message="Something went wrong !!"}=err;
    res.render("error.ejs",{message});
});

//listening
app.listen(port, (req, res) => {
  console.log(`app is listening to ${port}`);
});





