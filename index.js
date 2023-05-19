const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ju4cdjp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const legoCollections = client.db('legoCars').collection('legos')

        // indexing for toyName search
        const indexKeys = { toyName: 1 }
        const indexOptions = { name: 'toyName' }
        const result = await legoCollections.createIndex(indexKeys, indexOptions)

        // load all the legos by default and limited search by toy name
        app.get('/legos', async (req, res) => {
            // console.log(req.query)
            const toyName = req.query.toyname;
            // console.log(toyName)
            let query = {}
            if (toyName) {
                query = { $or: [{ toyName: { $regex: toyName, $options: 'i' } }] }
                // query = {
                //     $text: { $search: toyName }
                // }
            }
            // console.log(query)
            const result = await legoCollections.find(query).toArray()
            // console.log(result)
            res.send(result)
        })
        // get lego data based on category
        app.get('/toys', async (req, res) => {
            // console.log(req.query);
            const category = req.query.category;
            const query = { category: category }
            // console.log(query)
            const result = await legoCollections.find(query).toArray()
            // console.log(result)
            res.send(result)
        })


        // load all the legos by default and limited search by toy name
        app.get('/mylegos', async (req, res) => {
            // console.log(req.query)
            const email = req.query.email;
            let query = {}
            if (email) {
                query = { sellerEmail: email }

            }
            // console.log(query)
            const result = await legoCollections.find(query).toArray()
            // console.log(result)
            res.send(result)
        })

        // add a new lego
        app.post('/toys', async (req, res) => {
            const legoInfo = req.body;
            // console.log(legoInfo)
            const result = await legoCollections.insertOne(legoInfo)
            // console.log(result);
            res.send(result);
        })

        // update a lego 
        app.patch('/toys/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const updateInfo = req.body;
            // console.log(updateInfo)
            const query = { _id: new ObjectId(id) }
            // console.log(query)

            const updatedDoc = {
                $set: {
                    toyPhoto: updateInfo.photo,
                    quantity: updateInfo.quantity,
                    price: updateInfo.price,
                    detail: updateInfo.detail
                }
            }
            // console.log(updatedDoc)
            const result = await legoCollections.updateOne(query, updatedDoc);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Lego server is running')
})
app.listen(port, () => {
    console.log(`lego server is running in port ${port}`)
})