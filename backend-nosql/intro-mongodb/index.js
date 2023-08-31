import express from 'express'
import mongoose from 'mongoose'

const server = express();
const PORT = 3000;
server.use(express.json());

async function main(){
    try{
        await mongoose.connect('mongodb+srv://mongito:1234@cluster0.wywcthg.mongodb.net/')
        server.listen (PORT, ()=>{
            console.log(`server up in  http://localhost:${PORT}`)
        });
    }catch (error){
        console.log.error('Error:', error.message)
    };


    
}


main()


