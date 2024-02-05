
/////////////
const MONGODB_URI = require('./config');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
app.use(cors());


mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'Air', // Specify the name of the new database
  });
// Define mongoose schema and model (models/User.js)
const User = mongoose.model('User', {
  username: String,
  email: String,
  phone: String,
  password: String,
});

// Define mongoose schema and model for City and Ticket
const CitySchema = new mongoose.Schema({
    name: String,
  });
  
  const City = mongoose.model('City', CitySchema);
  
  const TicketSchema = new mongoose.Schema({
    userId: String,
    flightName: String,
    from: String,
    destination: String,
    price: Number,
    date: Date,
  });
  
  const Ticket = mongoose.model('Ticket', TicketSchema);
  // Define mongoose schema and model for Flight
const FlightSchema = new mongoose.Schema({
    userId: String,
    name: String,
    from: String,
    destination: String,
    priceEconomy: Number,
    priceBusiness: Number,
    date: Date,
  });
  
  const Flight = mongoose.model('Flight', FlightSchema);

// Middleware
app.use(bodyParser.json());

// Routes

// User registration
app.post('/api/register', async (req, res) => {
    try {
      const { username, email, phone, password } = req.body;
  
      // Check if the user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = new User({
        username,
        email,
        phone,
        password: hashedPassword,
      });
  
      await newUser.save();
  
      // If registration is successful, send back user data
      res.status(201).json({
        message: 'User registered successfully',
        username: newUser.username, // Include other user data if needed
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error during registration', error: error.message });
    }
  });
  
//Import City Model
// Create a route or a script to insert cities
app.post('/api/insert-cities', async (req, res) => {
    try {
      // Array of Indian cities
      const indianCities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata',
        'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
        // Add more cities as needed
      ];
  
      // Insert cities into the database
      await City.insertMany(indianCities.map(city => ({ name: city })));
  
      res.status(200).json({ message: 'Cities inserted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error inserting cities', error: error.message });
    }
  });
  
// User login
app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Check if the user exists
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Compare the hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // If login is successful, send back user data
      res.status(200).json({
        message: 'Login successful',
        userId: user.id, // Include user ID
        username: user.username, // Include other user data if needed
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error during login', error: error.message });
    }
  });


// Fetch cities
app.get('/api/cities', async (req, res) => {
    try {
      const cities = await City.find({}, 'name');
      res.json({ cities });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching cities', error: error.message });
    }
  });
  
// Ticket booking
// Ticket booking
app.post('/api/ticket-booking', async (req, res) => {
    try {
      const { userId, from, destination, flightName, price, date } = req.body;
  
      // Create a new Ticket instance
      const newTicket = new Ticket({
        userId,
        flightName,
        from,
        destination,
        price,
        date,
      });
  
      // Save the new ticket to the database
      await newTicket.save();
  
      res.status(200).json({ message: 'Ticket booked successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error during ticket booking', error: error.message });
    }
  });
  // Fetch tickets for a specific user ID
  app.get('/api/my-bookings/:userId', async (req, res) => {
    try {
      // Extract user ID from the request parameters
      const { userId } = req.params;
  
      // Convert userId to ObjectId if it's stored as a string
      const userIdObj = new mongoose.Types.ObjectId(userId);
  
      // Find all tickets associated with the provided user ID
      const tickets = await Ticket.find({ userId: userIdObj });
  
      // Find the current user
      const currentuser = await User.findOne({ _id: userIdObj }, 'username'); // Adjust fields as needed
  
      // Send the list of tickets and the current user as a JSON response
      res.json({ tickets, currentuser });
    } catch (error) {
      // Handle errors and send an error response
      console.error(error);
      res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
  });
  // Cancel a ticket
app.delete('/api/cancel-ticket/:ticketId', async (req, res) => {
    try {
      const { ticketId } = req.params;
  
      // Convert ticketId to ObjectId if it's stored as a string
      const ticketIdObj = new mongoose.Types.ObjectId(ticketId);
  
      // Find and remove the ticket
      const deletedTicket = await Ticket.findByIdAndDelete(ticketIdObj);
  
      if (!deletedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      res.json({ message: 'Ticket canceled successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error canceling ticket', error: error.message });
    }
  });

  app.post('/api/add-flight', async (req, res) => {
    try {
      const { userId, name, from, destination, priceEconomy, priceBusiness, date } = req.body;
  
      // Create a new Flight instance
      const newFlight = new Flight({
        userId,
        name,
        from,
        destination,
        priceEconomy,
        priceBusiness,
        date,
      });
  
      // Save the new flight to the database
      await newFlight.save();
  
      res.status(200).json({ message: 'Flight added successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding flight', error: error.message });
    }
  });
  

  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });
  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Add a new endpoint to get available flights
app.get('/api/available-flights', async (req, res) => {
    try {
      const { from, destination } = req.query;
  
      // Query the database to get available flights based on 'from' and 'destination'
      const availableFlights = await Flight.find({ from, destination });
  
      res.status(200).json({ flights: availableFlights });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching available flights', error: error.message });
    }
  });
  