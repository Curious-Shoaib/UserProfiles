require('dotenv').config();         
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const cookieParser=require('cookie-parser');
const {resolve,join}=require('path');
const errorLogger=require('./utility/errorLogger').errorLoger;
const requestLogger=require('./utility/requestLogger').requestLogger;
const {getMongoDBconnecttion}=require('./utility/connection');
const multer=require('multer');
const userRouter=require('./routes/userRouter');
const homeRouter=require('./routes/homeRouter');
var upload = multer({ dest: 'private' });
const {authenticate : checkAuthentication,preLoginAuth,restrictTo}=require('./middleware/userAuthentication');
const mongoLocalURL='mongodb://localhost:27017/userProfilesDB';
app.set("view engine","ejs");
app.set("views",resolve(join(__dirname,"/views")));        // set the src/views folder as default to resolve view path

const PORT=process.env.PORT || 3000;
const mongoURL=process.env.MONGO_REMOTE_URL || mongoLocalURL;
getMongoDBconnecttion(mongoURL).then(()=>{
    console.log("mongoDB connected with :- ",mongoURL);
})
// public api
app.use('/asset' ,express.static(join(__dirname, 'asset')));   
app.use(bodyParser.json());  // to parse json string to json object and attach it to req.body
app.use(bodyParser.urlencoded({extended : false}));  // to decode url encoded form data to native form data under req body object 
app.use(cookieParser());                // middleware to parse cookies and attach it as object to req.cookie

app.use(requestLogger);
app.use('/user',preLoginAuth,userRouter);           // user signIn & signUp router.
app.use(checkAuthentication);                   // all APIs will hit here first, this will navigate api to /user or below
app.use('/private' ,express.static(join(__dirname, 'private')));                      
app.use('/',restrictTo(["Normal","Admin"]),homeRouter);          //authorization


app.use('*',(req,res,next) => {
    res.status(404).json({message : "This web page does not exist"});
});

app.use(errorLogger);

app.listen(PORT, ()=> {
    console.log(`Server is listening on ${PORT}`);
});