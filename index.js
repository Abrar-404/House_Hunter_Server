const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 204,
    exposedHeaders: ['Access-Control-Allow-Headers'],
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eted0lc.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const userCollection = client.db('houseHunter').collection('users');
    const addHouseCollection = client.db('houseHunter').collection('houses');
    const rentHouseCollection = client
      .db('houseHunter')
      .collection('renthouses');
    const editHouseCollection = client
      .db('houseHunter')
      .collection('edithouse');

    app.get('/protected', (req, res) => {
      const token = req.cookies.jwt;

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        res.json({ message: 'Protected route accessed', user: decoded });
      });
    });

    app.get('/addhouse', async (req, res) => {
      const cursor = addHouseCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/renthouse', async (req, res) => {
      const cursor = rentHouseCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/addhouse/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addHouseCollection.findOne(query);
      res.send(result);
    });

    app.post('/addhouse', async (req, res) => {
      const reviews = req.body;
      const result = await addHouseCollection.insertOne(reviews);
      res.send(result);
    });

    app.post('/renthouse', async (req, res) => {
      const reviews = req.body;
      const result = await rentHouseCollection.insertOne(reviews);
      res.send(result);
    });

    app.post('/addhouse/:id', async (req, res) => {
      const roomsAdd = req.body;
      console.log(roomsAdd);
      const result = await addHouseCollection.insertOne(roomsAdd);
      res.send(result);
    });

    app.patch('/addhouse/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      console.log('Update Query:', filter, data);
      const updatedDoc = {
        $set: {
          name: data?.name,
          email: data?.email,
          number: data?.number,
          address: data?.address,
          city: data?.city,
          bedrooms: data?.bedrooms,
          bathroom: data?.bathroom,
          room: data?.room,
          rent: data?.rent,
          available: data?.available,
          picture: data?.picture,
          description: data?.description,
        },
      };
      const result = await addHouseCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete('/addhouse/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addHouseCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });

    app.post('/register', async (req, res) => {
      const { username, email, number, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save the user to the database
      await userCollection.insertOne({
        username,
        email,
        number,
        password: hashedPassword,
      });

      res.json({ message: 'User registered successfully' });
    });

    app.post('/login', async (req, res) => {
      const { email, password } = req.body;

      const user = await userCollection.findOne({ email, password });

      if (!user) {
        return res
          .status(401)
          .json({ message: 'Invalid username or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res
          .status(401)
          .json({ message: 'Invalid username or password' });
      }

      const token = jwt.sign(
        { username: user.username },
        process.env.ACCESS_TOKEN_SECRET
      );
      res.cookie('jwt', token, { httpOnly: true });
      res.json({ message: 'Login successful' });
    });

    console.log('API endpoints are ready');

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Tech On Fire');
});

app.listen(port, () => {
  console.log(`Port is running on: ${port}`);
});
