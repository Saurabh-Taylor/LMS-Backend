import { Router } from 'express';
import {  getAllCourses, getLecturesByCourseId,createCourse,updateCourse,removeCourse, addLectureToCourseById} from '../controllers/courseController.js';
import { isLoggedIn , authorizedRoles } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = Router();

router.route('/')
    .get(getAllCourses)
    .post(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('thumbnail'),
        createCourse)
    


router.route('/:id')
    .get(isLoggedIn,getLecturesByCourseId)
    .put(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        updateCourse)
    .delete(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        removeCourse)
    .post(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('lecture'),
        addLectureToCourseById)    
export default router