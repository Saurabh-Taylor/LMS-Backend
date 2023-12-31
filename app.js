import express from "express"
import {config} from "dotenv"
config() 
import cookieParser from "cookie-parser"
import morgan from "morgan"
import cors from "cors"
import userRoutes from  "./routes/userRoutes.js"
import courseRoutes from "./routes/courseRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"

import errorMiddleware  from "./middleware/err.middleware.js";


const app = express()


app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))
// parse requests of content-type - application/json
app.use(express.json())
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended:true}))

app.use(cookieParser())
app.use(morgan("dev"))

app.use('/ping',(req,res)=>{
    res.send("Pong")
})

app.use('/api/v1/user',userRoutes)
app.use('/api/v1/courses',courseRoutes)
app.use('/api/v1/payments',paymentRoutes)


app.all("*",(req,res)=>{
    res.status(400).send("OOPS! Page not found")
})

app.use(errorMiddleware)

export default app