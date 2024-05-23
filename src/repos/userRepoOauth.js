const {userModel}=require('../models/userModel');
const userRepoOauth={};
userRepoOauth.Save= async (oAuthUser) => {
    try{

        await userModel.create(oAuthUser);
        const user=await userModel.findOne({email : oAuthUser.email});
        return user;
    }
    catch(error)
    {
        throw error;
    }
}


userRepoOauth.getUserByEmailOnly= async (email) => {

    try{
        const user=await userModel.findOne({email});
        return user;
    }
    catch(error)
    {
        error.message='No user found';
        error.type='custom';
        throw error;
    }
}


module.exports=userRepoOauth;
