import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { userResolvers, userTypeDefs } from './schemas/userSchema.js';
import { bookResolvers, bookTypeDefs } from './schemas/bookSchema.js';
import { auth } from './middlewares/auth.js';

const server = new ApolloServer({
  typeDefs: [userTypeDefs, bookTypeDefs],
  resolvers: [userResolvers, bookResolvers],
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async function({req, res}){
    return {
      auth: () => auth(req, res)
    } 
  }
});
console.log(`🚀  Server ready at: ${url}`);
