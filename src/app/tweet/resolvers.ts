import { Tweet, User } from "@prisma/client"; 
import { GraphqlContext } from "../../interfaces"; import { prismaClient } from "./../../client/db"; 
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; 
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'; 
import TweetService, { CreateTweetPayload } from "../../services/tweet";



// Initialize S3 client with credentials for accessing AWS S3 services
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION
});

// Define GraphQL queries
const queries = {
    getAllTweets: () =>  TweetService.getAllTweets(),                                                                                      // Fetch all tweets ordered by creation date in descending order
  // Generate a signed URL for uploading an image to aws S3 associated with a tweet
  getSignedURLForTweet: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    ctx: GraphqlContext                                                                       // Context containing user information and other data
  ) => {
    // Log user context for debugging purposes
    console.log("User context in getSignedURLForTweet:", ctx.user);

    // Check if user is authenticated; throw an error if not
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");

    // Validate the provided image type against allowed types
    const allowedImageTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(imageType)) throw new Error("Unsupported Image Type");

    // Create a PutObjectCommand to specify the upload parameters for S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET, // The target S3 bucket name
      Key: `uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}.${imageType}`,               // Unique key for the uploaded file
    });

    // Get a signed URL that allows temporary access to upload an object to S3
    const signedURL = await getSignedUrl(s3Client, putObjectCommand);
    
    return signedURL; 
  },
};

// Define GraphQL mutations
const mutations = {
  // Create a new tweet in the database
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext                                                                       // Context containing user information and other data
  ) => {
    // Log user context for debugging purposes
    console.log("User context in createTweet:", ctx.user);

    // Ensure user is authenticated; throw an error if not authenticated
    if (!ctx.user) {
      throw new Error("You are not authenticated");
    }

    // Create a new tweet entry in the database using Prisma Client
    const tweet = await TweetService.createTweet({
      ...payload,
      userId: ctx.user.id,
    })

    return tweet; 
  },
};

// Define extra resolvers for additional fields in GraphQL types (e.g., resolving authors of tweets)
const extraResolvers = {
  Tweet: {
    author: (parent: Tweet) =>
      prismaClient.user.findUnique({ where: { id: parent.authorId } }),                       // Fetch author details based on authorId field in Tweet model
  },
};

// Export resolvers for use in Apollo Server or other GraphQL server implementations
export const resolvers = { mutations, extraResolvers, queries };