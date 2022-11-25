const express = require('express')
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000 
const stripe = require("stripe")(`sk_test_51M6CE4BMtIhTvUhsjjwowd0TVare61yEtFADEVCRP3q3DxrbgtOI2XNnvvFeGsal680QelErzCop5KDlbIoNQfHr002idxqSLh`);

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
        const reportedProductCollection=client.db('FurnitureMarket').collection('reportedProduct')
        const wishListCollection=client.db('FurnitureMarket').collection('wishList')
        const paymentCollection=client.db('FurnitureMarket').collection('payments')

        app.get('/jwt',async(req,res)=>{
            const email = req.query.email 
            const query = {email:email} 
            const user = await userCollection.findOne(query)
            if(user){
                const token = jwt.sign({email:email},process.env.JWT_TOKEN,{expiresIn:'24h'})
                res.send({accessToken:token})
            }else{
                res.send({message:'user not found in database'})
            }
           
        })
        app.post('/create-payment-intent',async(req,res)=>{
            const booking = req.body 
            const price = booking.price
            const amount = parseInt(price)*100
            const paymentIntent = await stripe.paymentIntents.create({
                currency:'usd',
                amount:amount,
                payment_method_types: [
                    "card"
                  ],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })


        //post users information in db
        app.post('/users',async(req,res)=>{
            const user = req.body 
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.put('/users/verify',async(req,res)=>{
            const email=req.query.email
            const info = req.body
            const filter ={email:email}
            const options = { upsert: true }
            const updateDoc ={
                $set:info
            }
            const result = await userCollection.updateOne(filter,updateDoc,options)
            const productUpdate = await productsCollection.updateMany(filter,updateDoc,options)
            if(result.acknowledged && productUpdate.acknowledged){
                res.send(result)
            }
        })

        // get all category
        app.get('/categories',async(req,res)=>{
            const result = await categorycollection.find({}).toArray()
            res.send(result)
        })
        
        // get categorybase products
        app.get('/products/:category',async(req,res)=>{
            const category = req.params.category
            const query={$and : [{paid:{$ne:true}},{category:category}]}
            const result=await productsCollection.find(query).toArray()
            res.send(result)
        })

         //  get seller product
         app.get('/products',async(req,res)=>{
            const email = req.query.email 
            const query ={email:email}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
         })

         // product post in db
         app.post('/products',async(req,res)=>{
            const product = req.body 
            const result = await productsCollection.insertOne(product)
            res.send(result)
         })


        //  get reported product 
        app.get('/reportedProduct',async(req,res)=>{
            const result = await reportedProductCollection.find({}).toArray()
            res.send(result)
        })

        //post report product
         app.post('/reportedProduct',async(req,res)=>{
            const product = req.body 
            const title =product.title
            const email=product.userEmail
           
            const query = {$and:[{title:title},{userEmail:email}]}
            const reportProduct = await reportedProductCollection.findOne(query)
            if(!reportProduct){
                const result = await reportedProductCollection.insertOne(product)
                
                res.send(result)
            }
            else{
                res.send({message:'you already report this product'})
            }
         })

        //  delete report product
        app.delete('/reportedProduct',async(req,res)=>{
            const title = req.query.title 
            const query = {title:title}
           
            const result = await reportedProductCollection.deleteOne(query)
            const reportResult = await productsCollection.deleteOne(query)
            const wishListResult = await wishListCollection.deleteOne(query)
            if(result.deletedCount>0 && reportResult.deletedCount>0 && wishListResult.deletedCount>0){
                res.send({message:"Delete successfull"})
            }else{
                res.send({message:"Please try again"})
            }
        })

        // product wishlist
         app.post('/wishList',async(req,res)=>{
            const product = req.body 
            const title =product.title
            const email=product.email
          
            const query = {$and:[{title:title},{email:email}]}
            const wishProduct = await wishListCollection.findOne(query)
            if(!wishProduct){
                const result = await wishListCollection.insertOne(product)
                res.send(result)
            }
            else{
                res.send({message:'you already added your wishlist'})
            }
         })

         app.get('/wishList',async(req,res)=>{
            const email = req.query.email 
            const query={$and : [{paid:{$ne:true}},{email:email}]}
            const result = await wishListCollection.find(query).toArray()
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

        app.get('/orders',async(req,res)=>{
            const email = req.query.email 
            const query={$and : [{paid:{$ne:true}},{email:email}]}
            const result = await ordersCollection.find(query).toArray()
            res.send(result)
        })
        
         //  get seller product
         app.get('/order/payment/:title',async(req,res)=>{
            const title = req.params.title
            const query ={title:title}
            
            let result = await ordersCollection.findOne(query)
            if(!result){
                result = await wishListCollection.findOne(query)
            }
            res.send(result)
         })

        //  buyer payment

        app.post('/payments',async(req,res)=>{
            const payment = req.body 
            const title = payment.title
            const result = await paymentCollection.insertOne(payment)
            const filter = {title:title}
            const options = {upsert:true}
            const updateDoc={
                $set:{
                    paid:true
                }
            }
            const deleteProduct= await ordersCollection.deleteMany(filter)
            const updateResult=await productsCollection.updateOne(filter,updateDoc,options)
            const wishListResult= await wishListCollection.deleteMany(filter)

            if(result.acknowledged===true && updateResult.acknowledged===true && wishListResult.acknowledged===true){
                console.log('wish',wishListResult)
                console.log('deleet',deleteProduct)
                console.log('produt',updateResult)
                res.send(result)
            }
        })


        // verify user role
        app.get('/verifyRole',async(req,res)=>{
            const email = req.query.email 
            const query = {email:email}
            const user = await userCollection.findOne(query)
            if(user){
                res.send(user)
            }
        })

        app.get('/allsellers',async(req,res)=>{
            const query = {role:"seller"}
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/allsellers/:id',async(req,res)=>{
            const id = req.params.id 
            const query = {_id:ObjectId(id)}
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/allbuyers',async(req,res)=>{
            const query = {role:"buyer"}
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/allbuyers/:id',async(req,res)=>{
            const id = req.params.id 
            const query = {_id:ObjectId(id)}
            const result = await userCollection.deleteOne(query)
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