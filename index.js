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

        const legoCollections = client.db('legoCars').collection('legos')
        const pickCollections = client.db('legoCars').collection('picks')
        const blogCollections = client.db('legoCars').collection('blogs')
        const bookingCollections = client.db('legoCars').collection('carts')

        // indexing for toyName search


        // load all the legos by default and limited search by toy name
        // app.get("/toySearch/:text", async (req, res) => {
        //     const text = req.params.text;
        //     const Alldata = await toyCollection.find().toArray();
        //     const result = Alldata.filter((data) => data.toyname.toLowerCase().includes(text.toLowerCase()));
        //     res.send(result);
        app.get('/legos', async (req, res) => {
            // console.log(req.query)
            const toyName = req.query.toyname;
            // console.log(toyName)
            let query = {}
            // if (toyName) {
            //     query = { toyName: toyName }
            // }
            // console.log(query)
            const allData = await legoCollections.find(query).limit(20).toArray()
            // console.log(allData)
            const result = allData.filter((data) => data.toyName.toLowerCase().includes(toyName.toLowerCase()));
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
        // app.get('/documents', async (req, res) => {
        //     const count = await legoCollections.estimatedDocumentCount()
        //     res.send({ count })
        // })
        app.get('/documents', async (req, res) => {
            const query = req.query;
            // console.log(query, '114')
            const result = (await legoCollections.find(query).toArray()).length
            // console.log(result)
            res.send({ result })
        })

        //get bookmark blog
        app.get('/blogs', async (req, res) => {
            const query = {};
            const result = await blogCollections.find(query).toArray()
            res.send(result)
        })

        // get order lego filter by email
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email }
            const result = await bookingCollections.find(filter).toArray();
            res.send(result);
        })

        // add a new lego
        app.post('/toys', async (req, res) => {
            const legoInfo = req.body;
            // console.log(legoInfo)
            const result = await legoCollections.insertOne(legoInfo)
            // console.log(result);
            res.send(result);
        })

        // post bookmark blog
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            // console.log(blog)
            const result = await blogCollections.insertOne(blog)
            res.send(result)
        })

        // lego add to cart 
        app.post('/carts', async (req, res) => {
            const bookingDetail = req.body;
            // console.log(bookingDetail)
            // const query = { _id: new ObjectId(req.body.toyId) }
            // const searchToy = await legoCollections.findOne(query)
            // console.log(searchToy)
            const result = await bookingCollections.insertOne(bookingDetail)
            res.send(result)
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
                    price: updateInfo.price,
                    quantity: updateInfo.quantity,
                    detail: updateInfo.detail
                }
            }
            // console.log(updatedDoc)
            const result = await legoCollections.updateOne(query, updatedDoc);
            res.send(result);
        })

        // update lego quantity after user add to cart lego
        app.patch('/legos/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const searchLego = await legoCollections.findOne(query)
            // console.log(searchLego)
            const updateInfo = req.body;
            // console.log(updateInfo)
            const updatedDoc = {
                $set: {
                    quantity: (searchLego.quantity - updateInfo.quantity)
                }
            }
            // console.log(updatedDoc)
            const result = await legoCollections.updateOne(query, updatedDoc)
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