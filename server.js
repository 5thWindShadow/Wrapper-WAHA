// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// --- Configuration ---
const PORT = process.env.PORT || 9000;
// This connection string uses the MongoDB container's service name ('mongodb')
// which will be defined in our docker-compose.yml file.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://myuser:mypassword@mongodb:27017/whatsapp_messages?authSource=admin';

// --- Initialize Express App ---
const app = express();
app.use(bodyParser.json({ limit: '10mb' })); // Use body-parser to handle incoming JSON

// --- MongoDB Connection ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('Could not connect to MongoDB.', err));

// --- Mongoose Schema & Model ---
// This defines the structure of the documents we'll save in MongoDB.
// We use a "catch-all" schema to store any valid JSON from WAHA.
const messageSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Message = mongoose.model('Message', messageSchema, 'incoming'); // Model, Schema, Collection Name

// --- Webhook Endpoint ---
// WAHA will send POST requests to this '/webhook' URL.
app.post('/webhook', async (req, res) => {
  console.log('Received a webhook!');
  console.log(JSON.stringify(req.body, null, 2)); // Log the full message body

  try {
    // Create a new message document from the request body
    const message = new Message(req.body);
    // Save it to the 'incoming' collection in our database
    await message.save();
    console.log('Message saved to MongoDB.');
    res.status(200).send('Message received and stored.');
  } catch (error) {
    console.error('Error saving message to MongoDB:', error);
    res.status(500).send('Error storing message.');
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Webhook listener service is running on port ${PORT}`);
});