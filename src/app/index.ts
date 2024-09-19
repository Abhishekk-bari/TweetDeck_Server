import express from "express"; // Importing the Express framework for building web applications
import bodyParser from 'body-parser'; // Importing body-parser middleware to handle JSON requests
import { ApolloServer } from '@apollo/server'; // Importing ApolloServer class to create a GraphQL server
import { expressMiddleware } from '@apollo/server/express4'; // Importing expressMiddleware to integrate Apollo Server with Express
import cors from 'cors';

import { User } from "./user";
import { Tweet } from'./tweet'
import JWTServices from "../services/jwt";
import { GraphqlContext } from "../interfaces";
import { mutations } from './tweet/mutations';
import { resolvers } from './user/resolvers';




export async function initServer() { // Defining an asynchronous function to initialize the server
    const app = express(); // Creating an instance of an Express application

    app.use(bodyParser.json()); // Using body-parser middleware to parse JSON request bodies
    app.use(cors());

    const graphqlServer = new ApolloServer<GraphqlContext>({ // Creating an instance of ApolloServer
        typeDefs: `
            ${User.types}
            ${Tweet.types}

            type Query {
                ${User.queries}
                ${Tweet.queries}
            }

            type Mutation {
                ${Tweet.mutations}
            }
        `,
        resolvers: { 
            Query: {
                ...User.resolvers.Query,
                ...Tweet.resolvers.queries,
            },
            Mutation: {
                ...Tweet.resolvers.mutations,
            },
            ...Tweet.resolvers.extraResolvers, 
            ...User.resolvers.extraResolvers,
        },
    });

    await graphqlServer.start();  // Starting the Apollo Server to listen for incoming requests

    app.use(
        "/graphql",
        expressMiddleware(graphqlServer, {
        context:async ({req, res }) => {
            return {
                user: req.headers.authorization 
                ?  JWTServices.decodeToken(req.headers.authorization.split("Bearer ")[1]) 
                : undefined,
            };
        },
    })
 ); // Setting up the /graphql endpoint for handling GraphQL requests

    return app; // Returning the Express application instance
}