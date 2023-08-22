import Course from "../models/courseModel.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises"

export const getAllCourses  = async (req,res,next)=>{
    try {
        const courses = await Course.find({}).select("-lectures");
    
        res.status(200).json({
          success: true,
          message: "All courses",
          courses,
        });
      } catch (e) {
        return next(new AppError(e.message, 500));
      }
}

export const getLecturesByCourseId = async (req,res,next)=>{
    try {
        const { id } = req.params
        console.log(id);
        if(!id){
            return res.json(400).json({
                success:false,
                message:"Cannot find the id"
            })
        }
        const course = await Course.findById(id)
        res.status(200).json({
            success:true,
            message:'Course Lectures fetched successfully',
            lectures:course.lectures
        })
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
}

export const createCourse = async(req,res,next)=>{
    try {
        const {title,description,category,createdBy} = req.body
    if(!title || !description || !category || !createdBy){
        return next(new AppError("All fields are required"),400)
    }
    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:{
            public_id:"Dummy",
            secure_url:"Dummy"
        },
    })
    if(!course){
        return next(new AppError("Course Could not be  created"),400)
    }

    if(req.file){
        const result = await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms'
        })
        console.log(JSON.stringify(result));
        if(result){
            course.thumbnail.public_id = result.public_id
            course.thumbnail.secure_url = result.secure_url
        }
        fs.rm(`uploads/${req.file.filename}`)
    }
    await course.save()
    res.status(200).json({
        success:true,
        message:"Course created successfully",
        course
    })
    } catch (error) {
      return next(new AppError(error.message,500))  
    }
}

export const updateCourse = async(req,res,next)=>{
    try {
        const {id} = req.params
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set:req.body
            },
            {
                runValidators:true
            }
        )

        if(!course){
            return next (new AppError("Course with given id doesnt exist"),500)
        }
        return res.status(200).json({
            success:true,
            message:"Course Updated Successfully",
            course
        })
    } catch (error) {
        return next(new AppError(error.message),500)
    }
}

export const removeCourse = async(req,res,next)=>{
    try {
        const{id} = req.params
        console.log(id);
        const course = await Course.findById(id)
        console.log(course);
        if(!course){
            return next(new AppError("Course with given id doest exist"),400)
        }
        await Course.findByIdAndDelete(id)
        res.status(200).json({
            success:true,
            message:'Course deleted succesfully'
        })
    } catch (error) {
        return next(new AppError(error.message),500)
    }
}


export const addLectureToCourseById = async(req,res,next)=>{
   try {
        const {title,description } =  req.body
        const {id} = req.params
        if(!title ||!description ){
            return next(new AppError('All field are mandatory'),400)
        }
        const course = await Course.findById(id)

        if(!course){
            return next(new AppError('Course with given id does not found'),400)
        }
        const lectureData = {
            title,
            description,
            lecture:{}
        }

        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms'
            })
            console.log(JSON.stringify(result));
            if(result){
                lectureData.lecture.public_id = result.public_id
                lectureData.lecture.secure_url = result.secure_url
            }
            fs.rm(`uploads/${req.file.filename}`)

            course.lectures.push(lectureData)
            course.numbersOfLectures = course.lectures.length

            await course.save()

            res.status(200).json({
                success:true,
                message:'Lectures added successfully to the course'
            })
        }

   } catch (error) {
        return next(new AppError(error.message),500)
   }

   


}
