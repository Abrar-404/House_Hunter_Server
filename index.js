const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5000',
      'https://house-hunter-f2298.web.app',
    ],
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
    // app.get('/renthouse', async (req, res) => {
    //   const cursor = rentHouseCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

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

    // Signup user
    app.post('/signup', async (req, res) => {
      const { name, email, password, role } = req.body;
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = { email: email };
      //   check existing user
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exist' });
      }
      const newUser = { name, email, password: hashedPassword, role };
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      // If user not found or password doesn't match, return an error
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Authorization Failure!');
      }
      const token = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: '1h',
        }
      );
      res.send(token);
    });

    // Get current user
    app.get('/currentuser', async (req, res) => {
      const token = req.headers.authorization;
      if (!token) {
        return res
          .status(401)
          .send({ message: 'Authorization token not found' });
      }
      //   console.log(token);

      //   verify token
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) {
            return res.status(401).send('Invalid token');
          }

          const user = await userCollection.findOne({
            _id: new ObjectId(decoded.userId),
          });
          // console.log(user);

          if (!user) {
            return res.status(404).send('User not found');
          }

          res.send(user);
        }
      );
    });

    //  check current user admin or not
    app.get('/owner/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { owner: user?.role === 'owner' };
      res.send(result);
    });

    // Signup user
    app.post('/signup', async (req, res) => {
      const { name, email, password, role } = req.body;
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = { email: email };
      //   check existing user
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exist' });
      }
      const newUser = { name, email, password: hashedPassword, role };
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      // If user not found or password doesn't match, return an error
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Authorization Failure!');
      }
      const token = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: '1h',
        }
      );
      res.send(token);
    });

    // Get current user
    app.get('/currentuser', async (req, res) => {
      const token = req.headers.authorization;
      if (!token) {
        return res
          .status(401)
          .send({ message: 'Authorization token not found' });
      }
      //   console.log(token);

      //   verify token
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) {
            return res.status(401).send('Invalid token');
          }

          const user = await userCollection.findOne({
            _id: new ObjectId(decoded.userId),
          });
          // console.log(user);

          if (!user) {
            return res.status(404).send('User not found');
          }

          res.send(user);
        }
      );
    });

    //  check current user admin or not
    app.get('/owner/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { owner: user?.role === 'owner' };
      res.send(result);
    });

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
