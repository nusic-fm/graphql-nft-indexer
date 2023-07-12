import { fromGlobalId, toGlobalId } from "graphql-relay";
import Token from "../models/Token.js";

const resolvers = {
  Query: {
    async token(_, { ID }) {
      return await Token.findById(ID);
    },
    async tokens(_, { paging, where }) {
      const { after, limit } = paging ?? { after: null, limit: 1 };
      const _limit = limit > 100 ? 100 : limit;
      let skip: any = 0;
      if (after) {
        const lastUser = await Token.findById(fromGlobalId(after).id);
        skip = { _id: { $gt: lastUser._id } };
      }
      const tokens = await Token.find(where)
        .skip(skip)
        .limit(_limit + 1);
      const hasNextPage = tokens.length > limit;
      const edges = tokens
        .slice(0, limit)
        .map((user) => ({ cursor: toGlobalId("User", user.id), node: user }));

      return {
        data: tokens.slice(0, limit),
        pageInfo: {
          hasNextPage,
          endCursor: hasNextPage ? edges[edges.length - 1].cursor : null,
        },
      };
    },
    async collections(_, { paging }) {
      const { after, limit } = paging ?? { after: null, limit: 10 };
      const _limit = limit > 100 ? 100 : limit;
      let skip: any = 0;
      if (after) {
        const lastUser = await Token.findById(fromGlobalId(after).id);
        skip = { _id: { $gt: lastUser._id } };
      }
      const tokens = await Token.aggregate([
        {
          $group: {
            _id: "$collectionAddress",
            collectionAddress: { $first: "$collectionAddress" },
            id: { $first: "$_id" },
          },
        },
        { $project: { _id: 0, collectionAddress: 1, id: 1 } },
        { $skip: skip },
        { $limit: _limit + 1 },
      ]);

      const collections = await Token.find({
        _id: { $in: tokens.map((t) => t.id) },
      });
      // .find()
      //   .distinct("collectionAddress")
      //   .skip(skip)
      //   .limit(_limit + 1);
      const hasNextPage = collections.length > limit;
      const edges = collections
        .slice(0, limit)
        .map((user) => ({ cursor: toGlobalId("User", user.id), node: user }));

      return {
        data: collections.slice(0, limit),
        pageInfo: {
          hasNextPage,
          endCursor: hasNextPage ? edges[edges.length - 1].cursor : null,
        },
      };
    },
  },
  // Mutation: {
  //   async createToken(_, { token: { name, address, tokenId } }) {
  //     const createdToken = new Token({ address, name, tokenId });
  //     const res = await createdToken.save();

  //     return {
  //       id: res.id,
  //       ...(res as any)._doc,
  //     };
  //   },
  // },
};

export default resolvers;
