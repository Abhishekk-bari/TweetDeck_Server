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
const db_1 = require("../../client/db");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = require("../../clients/redis");
const prisma = new client_1.PrismaClient(); // Instantiate PrismaClient to interact with the database.
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        const resultToken = yield user_1.default.verifyGoogleAuthToken(token);
        return resultToken;
    }),
    getCurrentUser: (parent, _args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id)
            return null;
        const user = yield db_1.prismaClient.user.findUnique({ where: { id } });
        return user;
    }),
    getUserById: (parent_1, _a, _ctx_1) => __awaiter(void 0, [parent_1, _a, _ctx_1], void 0, function* (parent, { id }, _ctx) { return db_1.prismaClient.user.findUnique({ where: { id } }); }),
};
const extraResolvers = {
    User: {
        tweets: (parent) => db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { following: { id: parent.id } },
                include: {
                    follower: true,
                },
            });
            return result.map((el) => el.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { follower: { id: parent.id } },
                include: {
                    following: true,
                },
            });
            return result.map((el) => el.following);
        }),
        recommendedUsers: (parent, _, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user)
                return [];
            const cachedValue = yield redis_1.redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`);
            if (cachedValue) {
                console.log("Cache Found");
                return JSON.parse(cachedValue);
            }
            console.log("Cache Not Found");
            // Fetching my followings
            const myFollowings = yield db_1.prismaClient.follows.findMany({
                where: { follower: { id: ctx.user.id } },
                include: { following: { include: { followers: { include: { following: true } } } } },
            });
            console.log("My Followings:", myFollowings);
            const users = [];
            // Loop through my followings
            for (const following of myFollowings) {
                for (const follower of following.following.followers) {
                    console.log("Processing follower:", follower.following.id); // Log to check IDs
                    if (follower.following.id !== ctx.user.id &&
                        myFollowings.findIndex((e) => (e === null || e === void 0 ? void 0 : e.followingId) === follower.following.id) < 0) {
                        users.push(follower.following);
                    }
                }
            }
            console.log("Users to be cached:", users); // Add log to inspect the users array
            // Uncomment if caching is needed
            yield redis_1.redisClient.set(`RECOMMENDED_USERS:${ctx.user.id}`, JSON.stringify(users));
            return users;
        })
    }
};
const mutations = {
    followUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated");
        yield user_1.default.followUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }),
    unfollowUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated");
        yield user_1.default.unfollowUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }),
};
exports.resolvers = { Query: queries, extraResolvers, mutations };
