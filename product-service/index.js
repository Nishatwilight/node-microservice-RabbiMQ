const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const amqp = require('amqplib');
const Product = require("./product");
const Orders = require("../order-service/index");
const isAuthenticated = require("../isAuthenticated");
var order;

app.use(express.json());
var channel, connection;
mongoose.connect('mongodb://localhost/product-service')
    .then(() => {
        console.log('Product-Service Connected to MongoDB');
    })
    .catch(err => {
        console.error('Product-Service MongoDB connection error:', err);
    });

async function connect() {
    const amqpServer = "amqp://localhost:5672"
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT")
}
connect()

//create a new product

app.post("/product/create", isAuthenticated, async (req, res) => {
    // req.user.email
    const {name, description, price} = req.body
    const newProduct = new Product({
        name,
        description,
        price
    })
    newProduct.save()
    return res.json(newProduct)
})
//Buy aproduct
 //User sends a list of Product id's to buy
 //Creating an order with those products and a total value of sum of the product price

 app.post("/product/buy", isAuthenticated, async (req, res) => {
    console.log("Received POST request to /product/buy");

    const {ids} = req.body
    const products = await Product.find({_id: {$in: ids}});
    console.log('products', products);
    const sendQueue = channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
     products,
     userEmail: req.user.email

    })))
    channel.consume("PRODUCT", data =>{
        console.log("CONSUMING PRODUCT QUEUE from oorder service");
         order = JSON.parse(data.content)
         channel.ack(data)
    })
    return res.json(order)
  })

app.listen(PORT, ()=>{
 console.log(`Product-Service at ${PORT}`);
})