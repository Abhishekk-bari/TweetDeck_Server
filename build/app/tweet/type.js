"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `

        input CreateTweetData {
                content: String!
                ImageURL: String

    }

        type Tweet {
        id: ID!
        content: String!
        ImageURL: String

        author: User
        
        }
`;
