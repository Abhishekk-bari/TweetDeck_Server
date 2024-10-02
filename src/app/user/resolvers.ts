import { PrismaClient, User } from "@prisma/client"; // Import PrismaClient from Prisma to interact with the database.
import axios from "axios"; // Import axios for making HTTP requests.
import JWTServices from "./../../services/jwt"; // Import JWT service for generating user tokens.
import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";
import UserServices from "../../services/user";
import { redisClient } from "../../clients/redis";

const prisma = new PrismaClient(); // Instantiate PrismaClient to interact with the database.

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserServices.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, _args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;

    const user = await prismaClient.user.findUnique({ where: { id } });
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    _ctx: GraphqlContext
  ) => prismaClient.user.findUnique({ where: { id } }),
};

const extraResolvers = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      return result.map((el) => el.follower);
    },

    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      return result.map((el) => el.following);
    },

    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
    
      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );
    
      if (cachedValue) {
        console.log("Cache Found");
        return JSON.parse(cachedValue);
      }
    
      console.log("Cache Not Found");
    
      // Fetching my followings
      const myFollowings = await prismaClient.follows.findMany({
        where: { follower: { id: ctx.user.id } },
        include: { following: { include: { followers: { include: { following: true } } } } },
      });
    
      console.log("My Followings:", myFollowings);
    
      const users: User[] = [];
    
      // Loop through my followings
      for (const following of myFollowings) {
        for (const follower of following.following.followers) {
          console.log("Processing follower:", follower.following.id); // Log to check IDs
          if (
            follower.following.id !== ctx.user.id &&
            myFollowings.findIndex((e) => e?.followingId === follower.following.id) < 0
          ) {
            users.push(follower.following);
          }
        }
      }
    
      console.log("Users to be cached:", users); // Add log to inspect the users array
    
      // Uncomment if caching is needed
      await redisClient.set(
        `RECOMMENDED_USERS:${ctx.user.id}`,
        JSON.stringify(users)
      );
    
      return users;
    }    
  }
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserServices.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`)
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserServices.unfollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`)
    return true;
  },
};

export const resolvers = { Query: queries, extraResolvers, mutations };