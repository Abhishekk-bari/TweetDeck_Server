import { prismaClient } from "../client/db";

// Define the payload structure for creating a tweet
export interface CreateTweetPayload {
    content: string;                                                         // Required content of the tweet
    imageURL?: string;
    userId: string                                               // Optional URL of an image associated with the tweet
}

class TweetService {
    public static createTweet(data: CreateTweetPayload) {
        return prismaClient.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: {connect: {id: data.userId } },
            }
        })
    }

    public static getAllTweets() {
        return prismaClient.tweet.findMany({ orderBy: { createdAT: "desc"} });
    }
}
export default TweetService;