const {userModel}=require('../models/userModel');
const userRepo={};

userRepo.saveUser= async (userObject) => {
    try{
       const user= await userModel.findOne({email : userObject.email});
       if(!user)
        await userModel.create(userObject);
       else if(user.accountType=='Native')
        {
            error.message='This email is Already in use, please sign in to continue.'
            error.type='custom';
            throw error;
        }
        else
        {
            const error=new Error("This email is associated with Google sign in, Please sign in with google");
            error.status=400;
            error.type='custom';
            throw error;
        }
    }
    catch(error)
    {
        throw error;
    }
    return true;
}

userRepo.getUser= async (email,password) => {
    try{
        const user=await userModel.findOne({email,password});
        return user;
    }
    catch(error)
    {
        error.message='No user found';
        error.type='custom';
        throw error;
    }
}

userRepo.getAllUser=async () => {
    try{
        const users=await userModel.find();
        if(users.length==0)
            throw new Error("");
        return users;
    }
    catch(error)
    {
        error.message='No user found';
        error.type='custom';
        throw error;
    }

}
userRepo.getPublicUsers=async () => {
    try{
        const users=await userModel.find({status : "Public"});
        if(users.length==0)
            throw new Error("");
        return users;
    }
    catch(error)
    {
        error.message='No user found';
        error.type='custom';
        throw error;
    }
}


userRepo.updateUserAndReturnUpdated=async(email,updateUser)=>{
        try {
            const updatedUser = await userModel.findOneAndUpdate({ email }, updateUser);
            return updatedUser;
        }
        catch (error) {
            throw error;
        }
}
module.exports=userRepo;