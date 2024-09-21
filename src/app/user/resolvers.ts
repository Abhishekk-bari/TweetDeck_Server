import { PrismaClient, User } from "@prisma/client"; // Import PrismaClient from Prisma to interact with the database.
import axios from "axios"; // Import axios for making HTTP requests.
import JWTServices from './../../services/jwt'; // Import JWT service for generating user tokens.
import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";

const prisma = new PrismaClient(); // Instantiate PrismaClient to interact with the database.

interface GoogleTokenResult { // Define an interface for the expected structure of the Google token response.
    iss?: string;
    nbf?: string;
    aud?: string;
    email?: string;
    email_verified?: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    iat?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}

const queries = {
    verifyGoogleToken: async (_parent: any, { token }: { token: string }) => {
        try {
            const googleToken = token; // Store the incoming token for verification.
            
            if (!googleToken) {
                throw new Error("No token provided");
            }

            const googleOauthURL = new URL('https://oauth2.googleapis.com/tokeninfo'); // Google's OAuth token info endpoint.
            googleOauthURL.searchParams.set('id_token', googleToken) // Set the id_token query parameter.

            // Try to fetch the Google token info and handle errors
            const { data } = await axios.get<GoogleTokenResult>(
                googleOauthURL.toString(),
                { responseType: 'json' }
            );

            // Log Google's response to check if token data is received correctly
            console.log("Google OAuth response data:", data);

            if (!data.email) {
                throw new Error("Invalid token or missing email in token");
            }

            // Use the instantiated `prisma` object to query the database.
            let user = await prismaClient.user.findUnique({
                where: { email: data.email },
            });

            // Create a new user if not found
            if (!user) {
                user = await prismaClient.user.create({
                    data: {
                        email: data.email || "",
                        firstName: data.given_name || "",
                        lastName: data.family_name || "",
                        profileImageURL: data.picture || "",
                    },
                });
            }

            // Generate a JWT token for the user
            const userToken = JWTServices.generateTokenForUser(user);

            return userToken; // Return the generated token.

        } catch (error: any) {
            console.error("Error verifying Google token:", error.message);
            
            // Return the error to the GraphQL client
            throw new Error(`Failed to verify Google token: ${error.message}`);
        }
    },
    getCurrentUser :async(_parent: any, _args: any, ctx: GraphqlContext) => {
        const id = ctx.user?.id
        if(!id) return null

        const user = await prismaClient.user.findUnique({where: {id} });
        return user;
    },
    getUserById: async ( 
        _parent: any, 
        {id}: { id: string }, 
        _ctx: GraphqlContext
    ) => prismaClient.user.findUnique({ where: { id } }),
};

const extraResolvers = {
    User: {
        tweets: (parent: User) => prismaClient.tweet.findMany({where: { author: { id: parent.id } } }),
    }
}

export const resolvers = { Query: queries, extraResolvers };
