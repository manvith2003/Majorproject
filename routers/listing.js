if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
  }
  console.log(process.env.SECRET_KEY);
  const nodemailer = require("nodemailer");
  const express = require("express");
  const router = express.Router();
  const app = express();
  const mongoose = require("mongoose");
  const port = 3000;
  const Listing = require("../models/listing.js");
  const path = require("path");
  const methodOveride= require("method-override");
  const ejsMate = require("ejs-mate");
  const wrapAsync =require("../utils/wrapAsync.js");
  const ExpressError =require("../utils/ExpressError.js");
  const Joi = require('joi');
  const {listingSchema,reviewSchema}  =require("../models/schema.js");
  const Review = require("../models/review.js");
  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');
  const session = require("express-session");
  const MongoStore = require('connect-mongo');
  const flash = require('connect-flash');
  const passport =require("passport");
  const LocalStratergy =require("passport-local");
  const  User =require("../models/user.js");
  const {isLogged, saveRedirectUrl,isOwner,validateListing,validatereview, isAuthor} =require("../middleware.js");
  const multer  = require('multer');
  const {storage}=require("../cloudConfig.js");
  const upload = multer({ storage });
  
  

//index route
router.get("/listings", wrapAsync(async (req, res) => {
    const list = await Listing.find({}); 
    res.render("listings/index.ejs", { list });
  }));
   
  
  //new route
  router.get("/listings/new",isLogged, (req, res) => {   
      res.render("listings/new.ejs");
  });
  
  
  // create route
  router.post("/listings", upload.single('listing[image]'), isLogged, validateListing, wrapAsync(
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
  router.get("/listings/:id",wrapAsync( async (req, res) => {
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
  router.get("/listings/filter/:id",wrapAsync(async(req,res)=>{
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
  router.get("/listings/:id/edit",isLogged,isOwner,wrapAsync(async(req,res)=>{
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
  router.put("/listings/:id", isLogged ,upload.single('listing[image]'),isOwner,validateListing,wrapAsync(async (req, res) => {
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
  router.delete("/listings/:id",isLogged,isOwner,wrapAsync(async(req,res)=>{
      let { id } = req.params;
      await Listing.findByIdAndDelete(id)
      req.flash("sucess","Deleted successfully!!");
      res.redirect("/listings")
  }));
  
  
 module.exports=router;