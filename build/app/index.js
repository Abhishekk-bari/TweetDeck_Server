"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = initServer;
const express_1 = __importDefault(require("express")); // Importing the Express framework for building web applications
const body_parser_1 = __importDefault(require("body-parser")); // Importing body-parser middleware to handle JSON requests
const server_1 = require("@apollo/server"); // Importing ApolloServer class to create a GraphQL server
const express4_1 = require("@apollo/server/express4"); // Importing expressMiddleware to integrate Apollo Server with Express
const cors_1 = __importDefault(require("cors"));
const user_1 = require("./user");
const tweet_1 = require("./tweet");
const jwt_1 = __importDefault(require("../services/jwt"));
function initServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)(); // Creating an instance of an Express application
        app.use(body_parser_1.default.json()); // Using body-parser middleware to parse JSON request bodies
        app.use((0, cors_1.default)());
        const graphqlServer = new server_1.ApolloServer({
            typeDefs: `
            ${user_1.User.types}
            ${tweet_1.Tweet.types}

            type Query {
                ${user_1.User.queries}
                ${tweet_1.Tweet.queries}
            }

            type Mutation {
                ${tweet_1.Tweet.mutations}
            }
        `,
            resolvers: Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, user_1.User.resolvers.Query), tweet_1.Tweet.resolvers.queries), Mutation: Object.assign({}, tweet_1.Tweet.resolvers.mutations) }, tweet_1.Tweet.resolvers.extraResolvers), user_1.User.resolvers.extraResolvers),
        });
        yield graphqlServer.start(); // Starting the Apollo Server to listen for incoming requests
        app.use("/graphql", (0, express4_1.expressMiddleware)(graphqlServer, {
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req, res }) {
                return {
                    user: req.headers.authorization
                        ? jwt_1.default.decodeToken(req.headers.authorization.split("Bearer ")[1])
                        : undefined,
                };
            }),
        })); // Setting up the /graphql endpoint for handling GraphQL requests
        return app; // Returning the Express application instance
    });
}
