const Listing = require("./models/listing");
const ExpressError =require("./utils/ExpressError.js");
const Joi = require('joi');
const {listingSchema,reviewSchema}  =require("./models/schema.js");
const Review = require("./models/review.js");

module.exports.isLogged=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You are not logged in");
        return res.redirect("/login");
      }
      next();
};


module.exports.saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl ){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};

module.exports.isAuthor =async (req,res,next)=>{
   let {reviewId ,id} =req.params;
   let review =await Review.findById(reviewId);

   if(!review.author.equals(res.locals.currUser._id)){
    req.flash("error", "You are not the author of this review");
    return res.redirect(`/listings/${id}`);
   }
   next();
};

module.exports.isOwner =async (req,res,next)=>{
    let {id} =req.params;
    let listings =await Listing.findById(id);
 
    if(!listings.owner._id.equals(res.locals.currUser._id)){
     req.flash("error", "You  have no permission to edit");
     return res.redirect(`/listings/${id}`);
    }
    next();
 };

 
module.exports.validateListing=(req,res,next)=>{
    let {error} =listingSchema.validate(req.body);
    if(error){
        let errmsg =error.details.map((er)=>er.message).join(',');
        throw new ExpressError(400 ,errmsg);
    }else{
        next();
    }
}

// function for joi review 
module.exports. validatereview=(req,res,next)=>{
    let {error} =reviewSchema.validate(req.body);
    if(error){
        let errmsg =error.details.map((er)=>er.message).join(',');
        throw new ExpressError(400 ,errmsg);
    }else{
        next();
    }
}
