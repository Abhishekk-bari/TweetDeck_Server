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
exports.resolvers = void 0;
const client_1 = require("@prisma/client"); // Import PrismaClient from Prisma to interact with the database.
const axios_1 = __importDefault(require("axios")); // Import axios for making HTTP requests.
const jwt_1 = __importDefault(require("./../../services/jwt")); // Import JWT service for generating user tokens.
const db_1 = require("../../client/db");
const prisma = new client_1.PrismaClient(); // Instantiate PrismaClient to interact with the database.
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        try {
            const googleToken = token; // Store the incoming token for verification.
            if (!googleToken) {
                throw new Error("No token provided");
            }
            const googleOauthURL = new URL('https://oauth2.googleapis.com/tokeninfo'); // Google's OAuth token info endpoint.
            googleOauthURL.searchParams.set('id_token', googleToken); // Set the id_token query parameter.
            // Try to fetch the Google token info and handle errors
            const { data } = yield axios_1.default.get(googleOauthURL.toString(), { responseType: 'json' });
            // Log Google's response to check if token data is received correctly
            console.log("Google OAuth response data:", data);
            if (!data.email) {
                throw new Error("Invalid token or missing email in token");
            }
            // Use the instantiated `prisma` object to query the database.
            let user = yield db_1.prismaClient.user.findUnique({
                where: { email: data.email },
            });
            // Create a new user if not found
            if (!user) {
                user = yield db_1.prismaClient.user.create({
                    data: {
                        email: data.email || "",
                        firstName: data.given_name || "",
                        lastName: data.family_name || "",
                        profileImageURL: data.picture || "",
                    },
                });
            }
            // Generate a JWT token for the user
            const userToken = jwt_1.default.generateTokenForUser(user);
            return userToken; // Return the generated token.
        }
        catch (error) {
            console.error("Error verifying Google token:", error.message);
            // Return the error to the GraphQL client
            throw new Error(`Failed to verify Google token: ${error.message}`);
        }
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id)
            return null;
        const user = yield db_1.prismaClient.user.findUnique({ where: { id } });
        return user;
    }),
};
const extraResolvers = {
    User: {
        tweets: (parent) => db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),
    }
};
exports.resolvers = { Query: queries, extraResolvers };
