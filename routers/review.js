const express = require("express");
const router = express.Router({mergeParams:true}); //very important for id access
const Listing = require("../models/listing.js");
const wrapAsync =require("../utils/wrapAsync.js");
const methodOveride= require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError =require("../utils/ExpressError.js");
const {listingSchema,reviewSchema}  =require("../models/schema.js");
const Review = require("../models/review.js");


// function for joi review 
const validatereview=(req,res,next)=>{
    let {error} =reviewSchema.validate(req.body);
    if(error){
        let errmsg =error.details.map((er)=>er.message).join(',');
        throw new ExpressError(400 ,errmsg);
    }else{
        next();
    }
}


//post review route
router.post("/",validatereview,wrapAsync(async(req,res)=> {
    let {id} =req.params;
    let listing =await Listing.findById(id);
    let newReview = new Review(req.body.review);
     listing.reviews.push(newReview);

     await newReview.save();
     await listing.save();
     res.redirect(`/listings/${listing._id}`);
}));


// delete review  route
router.delete("/:reviewId",wrapAsync(async(req,res)=>{
    let {id,reviewId} =req.params;
    
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));


module.exports=router;