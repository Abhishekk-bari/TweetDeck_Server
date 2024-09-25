import { PrismaClient, User } from "@prisma/client"; // Import PrismaClient from Prisma to interact with the database.
import axios from "axios"; // Import axios for making HTTP requests.
import JWTServices from './../../services/jwt'; // Import JWT service for generating user tokens.
import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";
import UserServices from "../../services/user";

const prisma = new PrismaClient(); // Instantiate PrismaClient to interact with the database.


const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const resultToken = await UserServices.verifyGoogleAuthToken(token);
        return resultToken;
        


    },
    getCurrentUser :async(parent: any, _args: any, ctx: GraphqlContext) => {
        const id = ctx.user?.id
        if(!id) return null

        const user = await prismaClient.user.findUnique({where: {id} });
        return user;
    },
    getUserById: async ( 
        parent: any, 
        {id}: { id: string }, 
        _ctx: GraphqlContext
    ) => prismaClient.user.findUnique({ where: { id } }),
};

const extraResolvers = {
    User: {
        tweets: (parent: User) => 
            prismaClient.tweet.findMany({where: { author: { id: parent.id } } }),
        followers: async (parent: User) =>{
        const result = await prismaClient.follows.findMany({ 
                where: { following: { id: parent.id} },
            include: {
                follower: true,
            }
            })
            return result.map((el) => el.follower);
        },
            
        following:async (parent: User) => {
            const result = await prismaClient.follows.findMany({
                where: { follower: { id: parent.id } },
                include: {
                    following: true,
                }
            })
            return result.map((el) => el.following);
        }

    },
};

const mutations = {
    followUser:async (parent: any, { to }: { to: string }, ctx: GraphqlContext

    ) => {
        if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
        await UserServices.followUser(ctx.user.id, to);
        return true;
    },
    unfollowUser:async (parent: any, { to }: { to: string }, ctx: GraphqlContext
        
    ) => {
        if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
        await UserServices.unfollowUser(ctx.user.id, to);
        return true;
    },
};

export const resolvers = { Query: queries, extraResolvers, mutations };
