// working perfectly fine -> 500 entries can be added at a time, takes a bit of time though


// this commit: increase the size limit to 10mb lets see if it works or not: 

// changes that has been made till now: 
// 1. First row is skipped
// 2. Email is null then also entry is added
// 3. Ltype or Llevels are null, then also language detials sections is added, 

// need to work: 
// duplicates can be still seen 



import express from 'express';
import cors from 'cors';
import connectToMongo from './database/db.js';
import mastersheet from './routes/mastersheet.js';
import client from './routes/client.js';
import users from './routes/user.js';

connectToMongo();
const app = express();
const port = 4000;

// Middleware
// app.use(express.json());
app.use(express.json({ limit: '10mb' })); // You can adjust the size here

app.use(cors());


// Available routes
app.get('/', (req, res) => {
    res.send('crm api are working');
});

app.use('/api/master', mastersheet);
app.use('/api/client', client);
app.use('/api', users);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
