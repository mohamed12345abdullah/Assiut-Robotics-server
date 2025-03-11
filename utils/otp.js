const speakeasy = require("speakeasy");
const secret = speakeasy.generateSecret({ length: 20 });
const httpStatusText = require('./httpStatusText');
const createError = require("./createError");
const asyncWrapper = require("../middleware/asyncWrapper");

const generateOtp =()=>{


    return  () => { 
            // throw(createError(600,"errrr","erorr in gen otp"))
            
            const code = speakeasy.totp({
                // Use the Base32 encoding of the secret key 
                secret: secret.base32,
                // Tell Speakeasy to use the Base32  
                // encoding format for the secret key 
                encoding: 'base32',
                // step:100
            });
            
            console.log('Secret: ', secret.base32);
            console.log('Code: ', code);
            return {secret:secret.base32 ,code};
        }

}


const verifyOtp = ()=>{
    return   async (secr,code) => {

            // throw("errrrrrrrrrrrrrrrrrrrrr")
            console.log("ver otp")
            var tokenValidates = speakeasy.totp.verify({ 
                secret:secr,
                encoding: 'base32',
                token: code,
                window: 6

            });
            console.log("verifi",tokenValidates);

            if (await tokenValidates) {
                // req.okOTP = tokenValidates;
                console.log("okkkk",tokenValidates);
                return true;
                // next();
            } else {
                const error=createError(400,httpStatusText.FAIL,"wrong code" )
                throw(error)
   
            }
    
            

    }
}


module.exports = {
    generateOtp,
    verifyOtp
}