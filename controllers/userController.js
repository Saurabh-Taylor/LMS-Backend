import User from "../models/userSchema.js"
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary"
import fs from "fs/promises"
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import { error, log } from "console";

const cookieOptions = {
    maxAge:7*24*60*60*1000,
    httpOnly:true,
    secure: true
}


export const register =async(req,res,next)=>{
    const {fullName,email,password} = req.body
    if(!fullName || !email || !password){
        return next(new AppError('All field are required',400))
    }
    const userExists =  await User.findOne({email})

    if(userExists){
        return next(new AppError('Email Already Exists',400))
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar:{
            public_id:email,
            secure_url:"https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg"
        }
    })

    if(!user){
        return next(new AppError('User Registration Failed,Please Try Again',400))
    }

    // TODO:File Upload
    console.log("File Details>>",JSON.stringify(req.file));
    if(req.file){
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                width:250,
                height:250,
                crop:'fill',
                gravity:'faces',
            })
            if(result){
                user.avatar.public_id = result.public_id
                user.avatar.secure_url = result.secure_url

                // remove the file from server
                fs.rm(`uploads/${req.file.filename}`)

            }
        } catch (error) {
            return next(new AppError(error || 'File not uploaded,please try again'),500)
        }
    }


    await user.save()

    user.password =  undefined

    const token = await user.jwtToken()
   
    res.cookie('token',token,cookieOptions)

    res.status(201).json({
        success:true,
        message:'Registration Successful',
        user
    })



}

export const login = async(req,res,next)=>{

    try {
        
    const {email,password} =req.body
    if(!email || !password){
        return next(new AppError('All field are required',400))
    }

    const user = await User.findOne({email}).select("+password")

    // console.log(user);
    // console.log(user.comparePassword(password));

    if(!user || !await(user.comparePassword(password))){
        return next(new AppError('Email or Password Doesnt Match',400))
    }

    const token = await user.jwtToken()
    user.password= undefined
    res.cookie("token",token,cookieOptions)
    res.status(200).json({
        success:true,
        message:"User Logged In Successfully",
        user
    })
    } catch (error) {
        return next(new AppError(e.message,500))
    }

}

export const logout = (req,res)=>{
    res.cookie("token",null,{
        secure:true,
        maxAge:0,
        httpOnly: true
    })

    res.status(200).json({
        success:true,
        message:"User Logged Out Successfully"
    })

}


export const getProfile = async(req,res)=>{

    try {
        const userId= req.user.id
        const user = await User.findById(userId)
        res.status(200).json({
            success:true,
            message:'User Details',
            user
        })
    } catch (error) {
        return next(new AppError('Failed to fetch profile',400))
    }

}

export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({email});
    if (!user) {
        return next(new AppError('Email not registered', 400));
    }

    const resetToken = await user.generatePasswordResetToken();
    console.log(resetToken);

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}reset/${resetToken}`;

    console.log(resetPasswordUrl);

    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`
        })
    } catch(e) {

        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();
        return next(new AppError(e.message, 500));
    }
}

export const resetPassword = async (req, res,next) => {
    const { resetToken } = req.params;

    const { password } = req.body;
    console.log("Reset Token:>",resetToken);
    console.log("password:>",password);

    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log(forgotPasswordToken);
    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    });
    console.log(user);

    if (!user) {
        return next(
            new AppError('Token is invalid or expired, please try again', 400)
        )
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.save();

    res.status(200).json({
        success: true,
        message: 'Password changed successfully!'
    })
}

export const changePassword = async (req,res,next)=>{
    const {oldPassword,newPassword} = req.body
    const { id } = req.user

    if(!oldPassword || !newPassword){
        return next(new AppError( 'All Fields Are mandatory'),400)
    }
    const user = await User.findById(id).select("+password")
    console.log(user);
    if(!user){
        return next(new AppError('User Does Not exist'),400)
    }

    const isPasswordValid = await user.comparePassword(oldPassword)
    if(!isPasswordValid){
        return next(new AppError('Invalid Old password'),400)
    }
    user.password = newPassword
    await user.save()
    user.password = undefined
    res.status(200).json({
        success:true,
        message:"Password Changed Successfully"
    })
}

export const updateUser = async(req,res)=>{
    const {fullName} = req.body
    const {id} = req.user.id

    const user = await User.findById({id})
    if(!user){
        return next(new AppError( 'User Does Not exist'),400)
    }

    if(req.fullName){
        user.fullName = fullName
    }
    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id)
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                width:250,
                height:250,
                crop:'fill',
                gravity:'faces',
            })
            if(result){
                user.avatar.public_id = result.public_id
                user.avatar.secure_url = result.secure_url

                // remove the file from server
                fs.rm(`uploads/${req.file.filename}`)

            }
        } catch (error) {
            return next(new AppError(error || 'File not uploaded,please try again'),500)
        }
    }
    await user.save()
    res.status(200).json({
        success:true,
        message:'User Details updated successfully'
    })
}