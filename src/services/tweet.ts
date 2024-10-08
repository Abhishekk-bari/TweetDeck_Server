import { prismaClient } from "../client/db";
import { redisClient } from "../clients/redis";

// Define the payload structure for creating a tweet
export interface CreateTweetPayload {
    content: string;                                                         // Required content of the tweet
    imageURL?: string;
    userId: string                                               // Optional URL of an image associated with the tweet
}

class TweetService {
    public static async createTweet(data: CreateTweetPayload) {
        const rateLimitFlag = await redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`
        );
        if (rateLimitFlag) throw new Error("Please wait...");
        const tweet = await prismaClient.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: {connect: {id: data.userId } },
            },
        });
        await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1)
        await redisClient.del("ALL_TWEETS");
            return tweet;
    }

    public static async getAllTweets() {
        const cachedTweets = await redisClient.get("ALL_TWEETS");
        if (cachedTweets) return JSON.parse(cachedTweets);
        
        const tweets = await  prismaClient.tweet.findMany({ 
            orderBy: { createdAT: "desc"} 
        });
        await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
        return tweets;
    }
}
export default TweetService;