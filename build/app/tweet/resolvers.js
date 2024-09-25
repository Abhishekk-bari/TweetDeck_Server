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
const db_1 = require("./../../client/db");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
const tweet_1 = __importDefault(require("../../services/tweet"));
// Initialize S3 client with credentials for accessing AWS S3 services
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_DEFAULT_REGION
});
// Define GraphQL queries
const queries = {
    getAllTweets: () => tweet_1.default.getAllTweets(), // Fetch all tweets ordered by creation date in descending order
    // Generate a signed URL for uploading an image to aws S3 associated with a tweet
    getSignedURLForTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { imageType, imageName }, ctx // Context containing user information and other data
    ) {
        // Log user context for debugging purposes
        console.log("User context in getSignedURLForTweet:", ctx.user);
        // Check if user is authenticated; throw an error if not
        if (!ctx.user || !ctx.user.id)
            throw new Error("Unauthenticated");
        // Validate the provided image type against allowed types
        const allowedImageTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
        if (!allowedImageTypes.includes(imageType))
            throw new Error("Unsupported Image Type");
        // Create a PutObjectCommand to specify the upload parameters for S3
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET, // The target S3 bucket name
            Key: `uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}.${imageType}`, // Unique key for the uploaded file
        });
        // Get a signed URL that allows temporary access to upload an object to S3
        const signedURL = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand);
        return signedURL;
    }),
};
// Define GraphQL mutations
const mutations = {
    // Create a new tweet in the database
    createTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx // Context containing user information and other data
    ) {
        // Log user context for debugging purposes
        console.log("User context in createTweet:", ctx.user);
        // Ensure user is authenticated; throw an error if not authenticated
        if (!ctx.user) {
            throw new Error("You are not authenticated");
        }
        // Create a new tweet entry in the database using Prisma Client
        const tweet = yield tweet_1.default.createTweet(Object.assign(Object.assign({}, payload), { userId: ctx.user.id }));
        return tweet;
    }),
};
// Define extra resolvers for additional fields in GraphQL types (e.g., resolving authors of tweets)
const extraResolvers = {
    Tweet: {
        author: (parent) => db_1.prismaClient.user.findUnique({ where: { id: parent.authorId } }), // Fetch author details based on authorId field in Tweet model
    },
};
// Export resolvers for use in Apollo Server or other GraphQL server implementations
exports.resolvers = { mutations, extraResolvers, queries };
