const userRepo=require('../repos/userRepo');
const userRepoOauth=require('../repos/userRepoOauth');
const userService={};

userService.saveUser=async (userObject)=>{

    const email=userObject.email;
    const emailRegex=new RegExp('[0-9A-Za-z]{1,12}[.]?[0-9A-Za-z]{1,10}@gmail.com');
    if(!emailRegex.test(email))
    {
        const error=new Error("Email must be type of @gmail.com");
        error.status=400;
        error.type="custom";
        throw error;
    }
    const phoneRegex=new RegExp('^[1-9]{1}[0-9]{9}$');
    if(!phoneRegex.test(userObject.phone))
    {
        const error=new Error("Phone must be valid 10 digit number");
        error.status=400;
        error.type="custom";
        throw error;
    }
    await userRepo.saveUser(userObject);
}

userService.getUser=async (email,password)=>{

    const user=await userRepoOauth.getUserByEmailOnly(email);
    if(user &&  user.accountType != 'Native')
    {
        const error=new Error("This email is associated with Google sign in, Please sign in with google");
        error.status=400;
        error.type='custom';
        throw error;
    }
    const result=await userRepo.getUser(email,password);
    if(result)
    {
        return result;
    }
    else
    {
        const error=new Error("Incorrect emailId or password");
       error.status=400;
       error.type='custom';
       throw error;
    }
}


userService.saveOauthUser=async (oAuthUser)=>{

   try{
        let user=await userRepoOauth.getUserByEmailOnly(oAuthUser.email);

        if(!user)
        {
           user= await userRepoOauth.Save(oAuthUser);
        }
        else if(user.accountType=='Native')
        {
            const error=new Error('You have a Native acoount alredy, plese sign in with email and password');
            error.status=400;
            error.type='custom';
            throw error;
        }
    return user;
   }
   catch(error)
   {
        throw error;
   }

   
}
userService.getAllusers=async(userRole)=>{
    try{

        if(userRole=='ADMIN' || userRole=='Admin')
        {
            const users=await userRepo.getAllUser();
            return users;
        }
        else
        {
            const users=await userRepo.getPublicUsers();
            return users;
        }

    }
    catch(error)
    {
        throw error;
    }

}


userService.updateUserAndReturnUpdated=async(email,updateUserObj)=>{
   try{
    const result=await userRepo.updateUserAndReturnUpdated(email,updateUserObj);
    return result;
   }
   catch(error)
   {
        console.log('error in user service, line 107',error);
       throw error;
   }
}
module.exports=userService;