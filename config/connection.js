const { MongoClient } = require('mongodb');

// Object to hold the state of the connection
const state = {
    db: null
};

// Function to connect to the MongoDB database
async function connect() {
    const url = 'mongodb://localhost:27017';
    const dbname = 'shopping';

    const client = new MongoClient(url);

    try {
        // Connect to the MongoDB server
        await client.connect();

        // Set the database instance
        state.db = client.db(dbname);

        console.log("Connected to MongoDB");

        // Return the database instance
        return state.db;
    } catch (err) {
        // Handle connection errors
        console.error("Failed to connect to MongoDB:", err);
        throw err; // Throw the error to handle it in the calling function
    }
}

// Function to get the database instance
function get() {
    return state.db;
}

module.exports = { connect, get };
