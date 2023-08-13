import JWT  from "jsonwebtoken"
import AppError from "../utils/error.util.js";

export const isLoggedIn = async(req,res,next)=>{
    const {token} = req.cookies
    if(!token){
        return next(new AppError('Unauthenticated,Please Login Again',400))
    }

    const userDetails = await JWT.verify(token,process.env.JWT_SECRET)
    req.user = userDetails
    next()
}