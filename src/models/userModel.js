
const mongoose=require('mongoose');

const userSchema=mongoose.Schema({
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    phone : {
        type : Number
    },
    password : {
        type : String
    },
    role : {
        type : String,
        default : 'Normal'
    },
    status : {
        type : String,
        default : 'Public'
    },
    accountType : {
        type : String,
        default : 'Native'
    },
    photoPath : {
        type: String
    }
},{timestamps : true});


exports.userModel=mongoose.model('userCollection',userSchema);