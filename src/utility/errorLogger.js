const fs=require('fs');

exports.errorLoger=(err,req,res,next) => {
        fs.appendFile('./errorLogger.txt',`${new Date().toLocaleTimeString()}-${err.message} - ${err.stack}\n`, (error)=> {if(error){console.log("error in error logger")}});
        if(!err.status)
        {
                err.status=500;
        }

        if(!err.type)
        {
                res.render('errorPage',{err});
        }
};