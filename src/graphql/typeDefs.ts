const typeDefs = `#graphql
  type Token {
    name: String
    address: String
    tokenId: String
  }
  input TokenInput {
    name: String
    address: String
    tokenId: String
  }

  type Query {
    token(ID: ID!): Token!
    getTokens(limit: Int): [Token]
  }

  type Mutation {
    createToken(token: TokenInput!): Token!
  }
`;
export default typeDefs;
