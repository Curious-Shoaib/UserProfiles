
const {verifyToken}=require('../service/authService');


exports.authenticate=(req,res,next)=>{
    const uid=req.cookies?.uid;
    if(!uid)
    {
        res.redirect('/user/login');
    }
    else
    {
        const userClaims=verifyToken(uid);
        if(!userClaims)
        {
            res.redirect('/user/login');
        }
        else{
            req.user=userClaims;            // attaching decoded user object to req object to use it in authorization
            next();                     // control will go to targetted method.
        }
    }
}
exports.preLoginAuth=(req,res,next)=>{
    const uid=req.cookies?.uid;
    if(!uid)
    {
        next();         // next will call next handler (having same http method and same path),  or next matching router.
                        //here it will call userRouter's matched route and method. 
        // in this case, user router's signIn or signUp will be called.
    }
    else
    {
        const userClaims=verifyToken(uid);          // return payload if varified
        if(!userClaims)
        {
            next();
        }
        else{
            res.redirect('/');          // to homePage
        }
    }
}


exports.restrictTo=(roles)=>{               //returning a closure, when middleware funtion will be returned, it will carry roles array confined with it.
    return async(req,res,next)=>{
        if(!roles.includes(req.user.role))
        {
            res.end("Not Authorized");
        }
        else
            next();
    }
};