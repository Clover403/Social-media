import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { userResolvers, userTypeDefs } from "./schemas/user.js";
import { postResolvers, postTypeDefs } from "./schemas/Post.js";
import { auth } from "./middlewares/auth.js";
import { initializeDb } from "./config/mongodb.js";

// Ensure database is initialized before starting the server
await initializeDb();

const server = new ApolloServer({
  typeDefs: [userTypeDefs, postTypeDefs],
  resolvers: [userResolvers, postResolvers],
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 3000 },
  context: async ({ req, res }) => {
    return {
      auth: () => auth(req, res),
    };
  },
});

console.log(`🚀  Server ready at: ${url}`);
