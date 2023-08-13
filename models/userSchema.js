import {Schema,model} from "mongoose"
import bcrypt from "bcrypt"
import JWT from "jsonwebtoken";

const userSchema = new Schema(
    {

        fullName:{
            type:String,
            required:[true,"Name is Required"],
            minLength:[5,"Enter Above 5 chars"],
            maxLength:[50,"Enter below 50 chars"],
            trim:true,
            lowercase:true
        },
        email:{
            type:String,
            required:[true,"Email is Required"],
            unique:true,
            trim:true,
            lowercase:true,
            match:[
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                'Please fill in a valid email address',
            ]
        },
        password:{
            type:String,
            required:[true,"Password is Required"],
            minLength:[8,'Password Must be atleast 9 characters']
        },
        avatar:{
            public_id:{
                type:String
            },
            secure_url:{
                type:String
            }
        },
        role:{
          type:'String',
          enum:['USER','ADMIN'],
          default:'USER'
        },
        forgetPasswordToken:"String",
        forgetPasswordExpiry:Date
    
    },{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next()
    }

    this.password = await bcrypt.hash(this.password,10)
     return next()
})

userSchema.methods = {
    jwtToken: async function(){
        return await JWT.sign(
            {id:this._id,email:this.email,subscription:this.subscription},
            process.env.JWT_SECRET,
            {expiresIn:'24h'}    
        )
    },
    comparePassword: async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword,this.password)
    }
}

const User = model("User",userSchema)

export default User