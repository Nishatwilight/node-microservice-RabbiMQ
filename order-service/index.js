const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 9090;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const amqp = require('amqplib');
const order = require("./order");
const isAuthenticated = require("../isAuthenticated");
app.use(express.json());
var channel, connection;

mongoose.connect('mongodb://localhost/order-service')
    .then(() => {
        console.log('order-Service Connected to MongoDB');
    })
    .catch(err => {
        console.error('order-Service MongoDB connection error:', err);
    });

async function connect() {
    const amqpServer = "amqp://localhost:5672"
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER")
}

function createOrder(products, userEmail) {
    let total = 0;
    for (let t=0; t<products.length; ++t){
        total += products[t].price;
    }
    const newOrder = new order({
        products,
        user: userEmail,
        totl_price: total
    })
    newOrder.save()
    return newOrder;
}

connect().then(()=>{
    channel.consume("ORDER", data => {
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail)
        console.log(products);
        console.log("Consuming ORDER queue from Product service");
        channel.ack(data)
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({newOrder})))
    })
})
app.listen(PORT, ()=>{
 console.log(`ORDER-Service at ${PORT}`);
})
