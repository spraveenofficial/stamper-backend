// import { MongoClient } from "mongodb";

// // MongoDB cluster connection URL
// const clusterUrl = "mongodb+srv://praveen:praveen@cluster0.ylniv.mongodb.net"; // Replace with your cluster URL
// const localUrl = "mongodb://127.0.0.1:27017"; // Local MongoDB URL

// // Database name
// const dbName = "Stamper"; // Replace with your database name

// async function transferCollections() {
//   let clusterClient, localClient;

//   try {
//     // Connect to the MongoDB cluster
//     clusterClient = new MongoClient(clusterUrl);
//     await clusterClient.connect();
//     console.log("Connected to MongoDB cluster");

//     // Connect to the local MongoDB instance
//     localClient = new MongoClient(localUrl);
//     await localClient.connect();
//     console.log("Connected to local MongoDB");

//     // Access the specific database on the cluster
//     const clusterDb = clusterClient.db(dbName);
//     const localDb = localClient.db(dbName);

//     // Get all collections from the specific database
//     const collections = await clusterDb.listCollections().toArray();

//     // Transfer each collection
//     for (const collectionInfo of collections) {
//       const collectionName = collectionInfo.name;
//       console.log(`Transferring collection: ${collectionName}`);

//       // Get the collection from the cluster
//       const clusterCollection = clusterDb.collection(collectionName);
//       const documents = await clusterCollection.find({}).toArray();

//       // Insert documents into the local collection
//       const localCollection = localDb.collection(collectionName);
//       if (documents.length > 0) {
//         await localCollection.insertMany(documents);
//         console.log(`Transferred ${documents.length} documents to local collection: ${collectionName}`);
//       } else {
//         console.log(`No documents found in collection: ${collectionName}`);
//       }
//     }

//     console.log("All collections transferred successfully!");
//   } catch (error) {
//     console.error("Error transferring collections:", error);
//   } finally {
//     // Close connections
//     if (clusterClient) {
//       await clusterClient.close();
//       console.log("Disconnected from MongoDB cluster");
//     }
//     if (localClient) {
//       await localClient.close();
//       console.log("Disconnected from local MongoDB");
//     }
//   }
// }

// // Run the script
// transferCollections();