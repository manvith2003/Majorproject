const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing =  require("../models/listing.js");


main()
.then(() => {
    console.log("Connection successful");
    initDB();
})
.catch((err )=> console.log(err));

async function main() {
await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');  
}

let categoryAll = [
	"beach",
	"hilly",
	"farms",
	"rooms",
	"trending",
	"new",
	"snowy",
	"skiing",
	"temple",
];


const initDB = async() =>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj,owner:"65fd4c147d131603a92ad431",
            category:[`${categoryAll[Math.floor(Math.random() * 22)]}`,`${categoryAll[Math.floor(Math.random() * 22)]}`],
}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};

 
initDB();





