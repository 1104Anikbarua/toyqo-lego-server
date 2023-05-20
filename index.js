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
        const pickCollections = client.db('legoCars').collection('picks')

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

            }
            // console.log(query)
            const result = await legoCollections.find(query).limit(20).toArray()
            // console.log(result)
            res.send(result)
        })
        // get lego data based on category
        app.get('/toys', async (req, res) => {
            // console.log(req.query);
            const category = req.query.category;
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.items);
            const skip = page * size;
            const query = { category: category }

            const result = await legoCollections.find(query).skip(skip).limit(size).toArray()
            // console.log(result)
            res.send(result)
        })


        // load all the legos by default and limited search by toy name and sort by high to low and low to high
        app.get('/mylegos', async (req, res) => {
            // console.log(req.query)
            const email = req.query.email;
            let query = {}
            if (email) {
                query = { sellerEmail: email }
            }
            const order = req.query.sort === 'asc' ? 1 : -1;

            // console.log(query)
            const result = await legoCollections.find(query).sort({ price: order }).toArray()
            // console.log(result)
            res.send(result)
        })

        // load single lego details 
        app.get('/legos/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await legoCollections.findOne(query);
            // console.log(result)
            res.send(result)
        })

        // load this week picks data 
        app.get('/pick', async (req, res) => {
            const query = {};
            const result = await pickCollections.find(query).toArray();
            res.send(result);
        })

        // get total lego count 
        app.get('/documents', async (req, res) => {
            const count = await legoCollections.estimatedDocumentCount()
            res.send({ count })
        })

        //get pins blog
        // app.get('pins', async (req, res) => {

        // })

        // add a new lego
        app.post('/toys', async (req, res) => {
            const legoInfo = req.body;
            // console.log(legoInfo)
            const result = await legoCollections.insertOne(legoInfo)
            // console.log(result);
            res.send(result);
        })
        // // post pin blog
        // app.post('pins', async (req, res) => {

        // })

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
                    // toyPhoto: updateInfo.photo,
                    price: updateInfo.price,
                    quantity: updateInfo.quantity,
                    detail: updateInfo.detail
                }
            }
            // console.log(updatedDoc)
            const result = await legoCollections.updateOne(query, updatedDoc);
            res.send(result);
        })
        // delete a lego
        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await legoCollections.deleteOne(query);
            // console.log(result)
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