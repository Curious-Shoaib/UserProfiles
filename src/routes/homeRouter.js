const express = require('express');
const userRouter = express.Router();
const userService = require('../service/userService');
const userRepoOauth = require('../repos/userRepoOauth');
const autService=require('../service/authService');
const multer = require('multer');
let fs = require('fs/promises');
const {join}=require('path');
//const multerr = require('../private/temp');


const storageTemp = multer.diskStorage({              // diskStorage engine gives control to set destination and name of file
    destination: (req, file, cb) => {
        return cb(null, join(__dirname,'../private/temp'));
    },
    filename: (req, file, cb) => {
        return cb(null, `${req.user.email}.jpg`);
    }
});
const uploadTemp = multer({ storage: storageTemp }); // telling multer that we are using storage engine


const storage = multer.diskStorage({   
    destination: (req, file, cb) => {
        return cb(null, join(__dirname,'../private/photos'));
    },
    filename: (req, file, cb) => {
        return cb(null, `${req.user.email}.jpg`);
    }
});
const uploadActual = multer({ storage: storage });



//this is home page endpoint
userRouter.get('/', async (req, res, next) => {
    const myProfile = req.user;
    res.render('homePage', { myProfile });
});



// Based on user role, this endpoint returns all user saved in DB
userRouter.get('/users', async (req, res, next) => {
    try {
        const profiles = await userService.getAllusers(req.user.role);
        res.render('otherUsers', { profiles });
    }
    catch (error) {
        next(error);
    }
});


// this endpoint handles user update requests from homepage edit section
userRouter.post('/',uploadTemp.single('profilePhoto') ,async (req, res, next) => {
    try {
        const myProfile = req.user;
        const directoryEntriesArray = await fs.readdir(join(__dirname,'../private/photos'));
        const isOldPhotoExist=(directoryEntriesArray.length>0 && directoryEntriesArray.includes(`${myProfile.email}.jpg`));
        if (req.body.password && req.user.accountType == 'oAuth') {
                const errorData = { message: 'You have signed in via google, you can change info except email and password' };
                const error=new Error();
                error.errorData=errorData;
                error.myProfile=myProfile;
                throw error;
            }
        if (req.body.email) {
            if (req.user.email == req.body.email) {
                const errorData = { message: 'New email Id and current email Id should be different, retry' };
                const error=new Error();
                    error.errorData=errorData;
                    error.myProfile=myProfile;
                    throw error;
            }
            else if (req.user.accountType == 'oAuth') {
                const errorData = { message: 'You have signed in via google, you can change info except email and password' };
                const error=new Error();
                    error.errorData=errorData;
                    error.myProfile=myProfile;
                    throw error;
            }
            else {
                let user = await userRepoOauth.getUserByEmailOnly(req.body.email);
                if (user) {
                    const errorData = { message: 'This email is already associated with another account' };
                    const error=new Error();
                    error.errorData=errorData;
                    error.myProfile=myProfile;
                    throw error;

                }
            }
        }
        const updateUserOb = {};              // preparing new user object that will be updated in database
        if (!req.body.email)
            updateUserOb.email = myProfile.email;
        else {
            const emailRegex = new RegExp('[0-9A-Za-z]{1,12}[.]?[0-9A-Za-z]{0,10}@gmail.com');
            if (!emailRegex.test(req.body.email)) {
                const errorData = { message: 'Email must be type of @gmail.com' };
                const error=new Error();
                error.errorData=errorData;
                error.myProfile=myProfile;
                throw error;
                // res.render('homePage', { myProfile, errorData });
                // return;
            }
            updateUserOb.email = req.body.email;
        }
        if (req.body.phone) {
            const phoneRegex = new RegExp('^[1-9]{1}[0-9]{9}$');
            if (!phoneRegex.test(req.body.phone)) {

                const errorData = { message: 'Phone must be valid 10 digit number' };
                const error=new Error();
                error.errorData=errorData;
                error.myProfile=myProfile;
                throw error;
                // res.render('homePage', { myProfile, errorData });
                // return;
            }
            updateUserOb.phone = req.body.phone;
        }
        if (req.body.firstName) {
            updateUserOb.firstName = req.body.firstName;
        }
        if (req.body.lastName) {
            updateUserOb.lastName = req.body.lastName;
        }
        if (req.body.password) {
            updateUserOb.password = req.body.password;
        }
        if (req.body.status) {
            updateUserOb.status = req.body.status;
        }
        if(req.body.email && isOldPhotoExist) {
            updateUserOb.photoPath = `private/photos/${updateUserOb.email}.jpg`;
        }
        if (req.file)
        {
            updateUserOb.photoPath = `private/photos/${updateUserOb.email}.jpg`;
        }
        else if (req.body.profilePhotoURL) {
            updateUserOb.photoPath = req.body.profilePhotoURL;
        }
        const savedUser = await userService.updateUserAndReturnUpdated(req.user.email, updateUserOb);
        if (savedUser) {
            const uId=autService.generateTokenForUser(savedUser);
            const successfullUpdate = { message: "updated successfully, redirecting you you to log in page." };
            


            // user new profile photo related code here
            // either email or photo is changed
            if(req.body.email || req.file || req.body.profilePhotoURL)
            {
                if(req.body.profilePhotoURL && isOldPhotoExist)
                    await fs.unlink(join(__dirname,`../private/photos/${myProfile.email}.jpg`));   // deleting old photo because new one is web url
                // executes when only email is updated and old photo exist in directory
                if(req.body.email &&  isOldPhotoExist && !req.file && !req.body.profilePhotoURL)         // this block is solely to change file name when only email is changed, no file updation
                {
                    await fs.rename(join(__dirname,`../private/photos/${myProfile.email}.jpg`), join(__dirname,`../private/photos/${req.body.email}.jpg`));
                }
                if(req.file)
                {
                    if(isOldPhotoExist)
                    {
                        await fs.unlink(join(__dirname,`../private/photos/${myProfile.email}.jpg`));   // deleting old photo
                    }

                    if(req.body.email)
                    {
                        await fs.rename(join(__dirname,`../private/temp/${myProfile.email}.jpg`),  join(__dirname,`../private/photos/${req.body.email}.jpg`));
                    }
                    else
                       {
                        await fs.rename(join(__dirname,`../private/temp/${myProfile.email}.jpg`),  join(__dirname,`../private/photos/${myProfile.email}.jpg`));
                       }
                }
            }
            
            res.cookie("uid" , uId);
            res.render('homePage', { myProfile, successfullUpdate });
          
        }
    }
    catch (err) {
        if(err.errorData)
        {
            const errorData=err.errorData;
            const myProfile=err.myProfile;
            try{
                if(req.file)
                await fs.unlink(join(__dirname,`../private/temp/${myProfile.email}.jpg`));   // deleting the currently saved photo
            }
            catch(error)
            {
                return next(error);
            }
            res.render('homePage', {myProfile, errorData });
            return;
        }
    else
       return next(err);
    }

});

module.exports = userRouter;