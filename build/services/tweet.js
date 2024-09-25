"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../client/db");
class TweetService {
    static createTweet(data) {
        return db_1.prismaClient.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: { connect: { id: data.userId } },
            }
        });
    }
    static getAllTweets() {
        return db_1.prismaClient.tweet.findMany({ orderBy: { createdAT: "desc" } });
    }
}
exports.default = TweetService;
