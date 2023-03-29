import Token from "../models/Token.js";

const resolvers = {
  Query: {
    async token(_, { ID }) {
      return await Token.findById(ID);
    },
    async getTokens(_, { limit }) {
      return await Token.find().sort({ createdAt: 1 }).limit(limit);
    },
  },
  Mutation: {
    async createToken(_, { token: { name, address, tokenId } }) {
      const createdToken = new Token({ address, name, tokenId });
      const res = await createdToken.save();

      return {
        id: res.id,
        ...(res as any)._doc,
      };
    },
  },
};

export default resolvers;
