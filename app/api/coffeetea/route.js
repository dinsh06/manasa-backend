import mongoose from "mongoose";

let isConnected = false; // Track the connection status

const fetchCollectionWithRetry = async (collectionName, retries = 3, delay = 1000) => {
  try {
    const products = await mongoose.connection.db
      .collection(collectionName)
      .find({})
      .toArray();
    return products;
  } catch (error) {
    console.error(`Error accessing collection '${collectionName}': ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying... Attempts left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay)); // Delay before retry
      return fetchCollectionWithRetry(collectionName, retries - 1, delay);
    }
    throw new Error(`Failed to fetch collection '${collectionName}' after retries.`);
  }
};

const connectWithRetry = async (retries = 3, delay = 1000) => {
  try {
    if (!isConnected) {
      const connection = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = connection.connections[0].readyState === 1;
      console.log("Connected to MongoDB.");
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying... Attempts left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay)); // Delay before retry
      return connectWithRetry(retries - 1, delay);
    }
    throw new Error("Failed to connect to MongoDB after retries.");
  }
};

export async function GET() {
  try {
    await connectWithRetry(3);
    const products = await fetchCollectionWithRetry("coffeetea", 3);

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch products" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}