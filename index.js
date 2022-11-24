const express = require('express')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000 

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ojtfupc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const userCollection=client.db('FurnitureMarket').collection('users')
        const categorycollection=client.db('FurnitureMarket').collection('categories')

        app.post('/users',async(req,res)=>{
            const user = req.body 
            const result = await userCollection.insertOne(user)
            console.log(result)
            res.send(result)
        })

        app.get('/categories',async(req,res)=>{
            const result = await categorycollection.find({}).toArray()
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(error=>console.error(error.message))

app.listen(port,()=>{
    console.log(`Furniture market is running on ${port}`)
})