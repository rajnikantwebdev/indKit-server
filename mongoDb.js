const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server
        await client.connect();
        console.log("Successfully connected! to database!");
    } catch (error) {
        console.error("Error inserting employees:", error);
    } 
}

run().catch(console.dir);

module.exports = { run, client };