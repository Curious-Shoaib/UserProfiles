const jwt=require('jsonwebtoken');
const secret= process.env.JWT_SECRET_KEY || 'Codes@14';                  // must be kept in secure place, anyone can sign and verify token with it

const authService={
};
authService.generateTokenForUser=(userObj)=>{
        let payload;
        if(userObj.accountType=='oAuth')
        {
            payload={
                firstName : userObj.firstName,
                lastName : userObj.lastName,
                email : userObj.email,
                role : userObj.role,
                photoPath : userObj.photoPath,
                status : userObj.status,
                accountType : 'oAuth'
                };
            if(userObj.phone)
                payload.phone=userObj.phone;
        }
        else
        {
            payload= {
                firstName : userObj.firstName,
                lastName : userObj.lastName,
                email : userObj.email,
                role : userObj.role,
                phone : userObj.phone,
                photoPath : userObj.photoPath,
                status : userObj.status,
                accountType : 'Native'
                };

        }
    const uid=jwt.sign(payload,secret);
    return uid;
}

authService.verifyToken=(uid)=>{

    if(!uid)
        return null;
    try{
        const claims=jwt.verify(uid,secret);   //return claims if token valid, throw error if uid has different signed key than the current key we have
        return claims;
    } 
    catch(error)
    {
        return null;
    }
}

module.exports=authService;
