import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import typeDefs from "./graphql/typeDefs.js";
import resolvers from "./graphql/resolvers.js";
import { MoralisIndexer } from "./indexer/index.js";
// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);
const MONGODB = `mongodb+srv://${process.env.MONGODB_USR}:${process.env.MONGODB_PWD}@music-nft-indexer-mongo.epw4hdg.mongodb.net/music_nfts?retryWrites=true&w=majority`;

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/",
  cors(),
  // 50mb is the limit that `startStandaloneServer` uses, but you may configure this to suit your needs
  bodyParser.json({ limit: "50mb" }),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token }),
  })
);
const port = 8080;
// Modified server startup
await mongoose.connect(MONGODB);
console.log("MongoDB connected");
await new Promise((resolve) =>
  httpServer.listen(port, undefined, undefined, () => resolve(0))
);
// new MoralisIndexer();
console.log(`🚀 Server ready at http://localhost:${port}/`);
