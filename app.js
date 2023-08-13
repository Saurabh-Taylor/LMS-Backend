import express from "express"
import {config} from "dotenv"
config() 
import cookieParser from "cookie-parser"
import morgan from "morgan"
import cors from "cors"
import userRoutes from  "./routes/userRoutes.js"
import errorMiddleware  from "./middleware/err.middleware.js";


const app = express()


app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))

app.use('/ping',(req,res)=>{
    res.send("Pong")
})

app.use('/api/v1/user',userRoutes)

app.all("*",(req,res)=>{
    res.status(400).send("OOPS! Page not found")
})

app.use(errorMiddleware)

export default app