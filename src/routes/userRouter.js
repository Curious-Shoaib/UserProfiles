const express=require('express');
const userRouter=express.Router();
const userService=require('../service/userService');
const autService=require('../service/authService');
const multer = require('multer');

//secure information
const CLIENT_ID = process.env.CLIENT_ID || '404178722071-ccoem0e91hvhr3caj5bcfikqv76v3b2b.apps.googleusercontent.com';
const HOSTNAME = process.env.HOSTNAME ||  'http://localhost:3000';
const CLIENT_SECRET=process.env.CLIENT_SECRET || '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';


const storage=multer.diskStorage({              // disk Storage engine gives control to set destination and name of file
    destination : (req,file,cb)=>{
        return cb(null,'private/photos');
    },
    filename : (req,file,cb)=>{
        return cb(null,`${req.body.email}.jpg`);
    }
});

const upload=multer({storage :storage}); // telling multer that we are using storage engine
userRouter.route('/signup')
.post(upload.single('profilePhoto'),async(req,res,next)=>{
    try{

        if(req.body.profilePhotoURL && req.body.profilePhotoURL.length>100)
        {
                const error=new Error();
                error.message='Profile photo URL is too lengthy, please provide within 100 characters';
                error.type='custom';
                throw error;
        }
        if(req.file)
        {
            req.body.photoPath=`private/photos/${req.body.email}.jpg`;
        }
        else if(req.body.profilePhotoURL)
        {
            req.body.photoPath=req.body.profilePhotoURL;
        }
        else
        {
            req.body.photoPath='private/photos/user.webp';
        }
        await userService.saveUser(req.body);
        res.render('loginPage');
    }
    catch(err)
    {
        if(err.type)
        {
            res.render('signUp',{err});
        }
        next(err);
    }
   
})
.get(upload.single('profilePhoto'),async(req,res,next)=>{
    try{
        res.render('signUp');
    }
    catch (err)
    {
        if(err.type)
            res.render('signUp',{err});
        next(err);
    }
   
});

userRouter.route('/login')                  //grouping of same route http methods
.post(async(req,res,next)=>{
    try{
        const user= await userService.getUser(req.body.email,req.body.password);
        if(user)
        {
            const uId=autService.generateTokenForUser(user);
            res.cookie("uid" , uId);
            res.redirect('/user/login');               // users sent to login page after login but this time it will have cookie
        }
    }
    catch(err)
    {
        if(err.type)
            res.render('loginPage',{err});
        next(err);
    }
   
})
.get(async(req,res,next)=>{
    try{
        res.render('loginPage');
    }
    catch (err)
    {
        if(err.type)
            res.render('loginPage',{err});
        next(err);
    }
});

// initialy, Oauth will start from here
userRouter.get('/auth/google/login', async(req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${HOSTNAME}/user/auth/google/callback&response_type=code&scope=profile email`;
    res.redirect(url);
  });
  


// Callback URL that will be called by google authorize server to send us authorization code
userRouter.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        // sending rest of the code to browser because  fetch API not woking in laptop due to no SSL
        const body=`
        const CLIENT_ID = '404178722071-ccoem0e91hvhr3caj5bcfikqv76v3b2b.apps.googleusercontent.com';
        const CLIENT_SECRET = '${CLIENT_SECRET}';
        const REDIRECT_URI = '${HOSTNAME}/user/auth/google/callback';

        (async()=>{
            try{
                let response=await fetch("https://oauth2.googleapis.com/token",
            {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code : "${code}",
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
                })
            });
            response= await response.json();
            const {access_token}=response;
            response=await fetch("https://www.googleapis.com/oauth2/v1/userinfo",
            {
                headers: {
                    Authorization: "Bearer "+access_token 
                },
                method: "GET"
            });
            response=await response.json();
            let responseFromMyServer=await fetch("${HOSTNAME}/user/auth/google/userdetails",
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: "POST",
                    body: JSON.stringify(response)
                });
            responseFromMyServer=await responseFromMyServer.json();

                if(responseFromMyServer.errorMessage)
                {
                    const newTextElement = document.createElement('p');
                    newTextElement.textContent = responseFromMyServer.errorMessage;
                    document.body.appendChild(newTextElement);
                    setTimeout(()=>{
                        window.location.href = responseFromMyServer.redirectUrl;
                    }, 1600);
                }
                else
                    window.location.href = responseFromMyServer.redirectUrl;
            }
            catch(error)
            {
                console.log("error aa gyi");
                console.log(error);
            }
        })();
        `;
      res.send('<script>' + body + '</script>');
    }
    catch (error) {
      next(err);
    }
  });
  


  // from client, this api will be called by client's fetch API to post user profile recieved from google
userRouter.post('/auth/google/userdetails',async(req,res,next)=>{
   try{
        const userProfile=req.body;
        const name=userProfile.name.split(' ');
        const oAuthUser={
            firstName: name[0],
            lastName: name[1],
            email: userProfile.email,
            photoPath: userProfile.picture,
            accountType: 'oAuth'
            };
          
                const user= await userService.saveOauthUser(oAuthUser);
                const uId=autService.generateTokenForUser(user);
                res.cookie("uid" , uId);
                res.json({redirectUrl :`${HOSTNAME}/user/login`})
   }
   catch(err)
   {
    res.json({errorMessage : err.message, redirectUrl :`${HOSTNAME}/user/login`});
   }    
});



module.exports=userRouter;
