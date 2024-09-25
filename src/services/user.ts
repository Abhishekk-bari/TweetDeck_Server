import axios from "axios";
import { prismaClient } from "../client/db";
import JWTServices from "./jwt";

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

class UserService {
    public static async verifyGoogleAuthToken(token: string) {
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
    }

    public static followUser(from: string, to: string) {
        return prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } },
            },
        });
    }

    public static unfollowUser(from: string, to: string) {
        return prismaClient.follows.delete({
            where:{ followerId_followingId: { followerId: from, followingId: to }}
        });
    }
}

export default UserService;