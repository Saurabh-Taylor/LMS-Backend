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

export const authorizedRoles = (...roles) => async (req, res, next) => {
    const currentUserRole = req.user.role;
    if (!roles.includes(currentUserRole)) {
        return next(
            new AppError('You do not have permission to access this route', 403)
        )
    }
    next();
}

export const authrorizeSubscriber = async(req,res,next)=>{
    const subscription = req.user.subscription
    const currentUserRole = req.user.role;
    if(currentUserRole !=='ADMIN' && subscription.status !=='active'){
        return next(new AppError("please subscribe to access this route!"),403)
    }
}