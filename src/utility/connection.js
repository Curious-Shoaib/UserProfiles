
const mongoose=require('mongoose');

exports.getMongoDBconnecttion=async(url)=>{
    try{
        await mongoose.connect(url);
    }
    catch(error)
    {
        error.status=500;
        throw error;   
    }
}