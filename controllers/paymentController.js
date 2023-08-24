import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
import Payment from "../models/paymentModel.js";
import User from "../models/userSchema.js";
import crypto from "crypto"


export const getRazorpayApiKey = async(req,res,next) =>{
    res.status(200).json({
        success:true,
        message:'Razorpay Api Key',
        key:process.env.RAZORPAY_KEY_ID
    })
}
export const buySubscription = async(req,res,next) =>{
    const {id} = req.user
    const user = await User.findById(id)
    if(!user){
        return next(new AppError('Unauthorized ,Please LogIn'),400)
    }
    if(user.role === 'ADMIN'){
        return next(new AppError('Admin Cannot Purchase a Subscription'),400)
    }
    const Subscription = await razorpay.subscriptions.create({
        plan_id:process.env.RAZORPAY_PLAN_ID,
        customer_notify:1
    })
    user.subscription.id = subscription.id
    user.subscription.status = subscription.status

    await user.save()
    res.status(200).json({
        success:true,
        message:"Subscribed Successfully",
        subscription_id:subscription.id

    })
}

export const verifySubscription = async(req,res,next) =>{
    const { id } = req.user
    const {razorpay_payment_id,razorpay_signature,razorpay_subscription_id} = req.body

    await User.findById(id)
    if(!user){
        return next(new AppError('Unauthorized ,Please LogIn'),400)
    }

    const subscriptionId = user.subscription.id
    const generatedSignature = crypto
        .createHmac('sha256',process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${subscriptionId}`)
        .digest('hex')
    
    if(generatedSignature !== razorpay_signature){
        return next(new AppError("Payment not verified , try again"),400)
    }
    await Payment.create({
        razorpay_payment_id,
        razorpay_signature,
        razorpay_subscription_id
    })

    user.subscription.status = 'active'
    await user.save()

    res.status(200).json({
        success:true,
        message:'Payment verified successfully'
    })



}

export const cancelSubscription = async (req, res, next) => {
    try {
      const { id } = req.user;
  
      const user = await User.findById(id);
  
      if (!user) {
        return next(new AppError("Unauthorized, please login"));
      }
  
      if (user.role === "ADMIN") {
        return next(new AppError("Admin cannot purchase a subscription", 400));
      }
  
      const subscriptionId = user.subscription.id;
  
      const subscription = await razorpay.subscriptions.cancel(subscriptionId);
  
      user.subscription.status = subscription.status;
  
      await user.save();
    } catch (e) {
      return next(new AppError(e.message, 500));
    }
}
  
export const allPayments = async(req,res,next) =>{

}
