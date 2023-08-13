import User from "../models/userSchema.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary"
import fs from "fs/promises"


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

export const forgetPassword = async(req,res)=>{
    
}