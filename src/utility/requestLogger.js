
const fs=require('fs');


exports.requestLogger=(req,res,next) => {
    fs.appendFile('./requestLogger.txt',`${new Date().toLocaleTimeString()}-${new Date().toLocaleDateString()} -${req.method}-${req.url}\n`,(error)=>{
        if(error)
        {
            console.log("error in request logging");
        }
    }
    )
    next();
}