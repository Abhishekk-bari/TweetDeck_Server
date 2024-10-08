"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
// In user.ts
exports.types = `

type User {
        id: ID!
        firstName: String!
        lastName: String    
        email: String!
        profileImageURL: String

        followers: [User]
        following: [User]

        recommendedUsers: [User]

        tweets: [Tweet]

    }
    
`;
