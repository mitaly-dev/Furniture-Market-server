const express = require('express')
var jwt = require('jsonwebtoken');
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
        const activitiesCollection=client.db('FurnitureMarket').collection('activities')
        const productsCollection=client.db('FurnitureMarket').collection('products')
        const ordersCollection=client.db('FurnitureMarket').collection('orders')

        app.get('/jwt',(req,res)=>{
            const email = req.query.email 
            const token = jwt.sign({email:email},process.env.JWT_TOKEN,{expiresIn:'24h'})
            res.send({accessToken:token})
        })

        //post users information in db
        app.post('/users',async(req,res)=>{
            const user = req.body 
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        // get all category
        app.get('/categories',async(req,res)=>{
            const result = await categorycollection.find({}).toArray()
            res.send(result)
        })

        // get categorybase products
        app.get('/products/:category',async(req,res)=>{
            const category = req.params.category
            const query={category:category}
            const result=await productsCollection.find(query).toArray()
            res.send(result)
        })

         // product post in db
         app.post('/products',async(req,res)=>{
            const product = req.body 
            const result = await productsCollection.insertOne(product)
            console.log(result)
            res.send(result)
         })



        // get activity seciton information
        app.get('/activities',async(req,res)=>{
            const result = await activitiesCollection.find({}).toArray()
            res.send(result)
        })

        // post user order in db
        app.post('/orders',async(req,res)=>{
            const order = req.body 
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })

        // verify user role
        app.get('/verifyRole',async(req,res)=>{
            const email = req.query.email 
            const query = {email:email}
            const user = await userCollection.findOne(query)
            console.log(user)
            res.send({role:user?.role})
        })

       

    }
    finally{

    }
}
run().catch(error=>console.error(error.message))

app.listen(port,()=>{
    console.log(`Furniture market is running on ${port}`)
})