const typeDefs = `#graphql
type TokenDoc {
  collectionName: String
  tokenId: String
  tokenUrlMimeType: String
  name: String
  collectionAddress: String,
  description: String,
  lastRefreshTime: String,
  metadata: NftMetadata,
  tokenStandard: String,
  tokenUrl: String,
  owner: String,
}
type NftMetadata {
  image_url: String
  name: String
  animation_url: String
}
type TransactionInfo {
    blockNumber: String
    blockTimestamp: String
    transactionHash: String
}
type Market {
  marketAddress: String
  marketType: String
  status: String
  tokenId: String
  transactionInfo: TransactionInfo!
}
type Data {
  token: TokenDoc!
  marketsSummary: [Market!]
}

input WhereTokenFilter {
  collectionAddress: String
  tokenId: String
}
input WhereFilter {
  collectionAddress: String
  tokens: WhereTokenFilter
}
  # input TokenInput {
  #   name: String
  #   address: String
  #   tokenId: String
  # }
  input Paging {
    after: String
    limit: Int
  }
  type PagingOut {
    hasNextPage: Boolean
    endCursor: String
  }
type Token {
  data: [Data!]
  pageInfo: PagingOut
}
  type Query {
    token(ID: ID!): Token!
    tokens(paging: Paging, where: WhereFilter): Token!
    collections(paging: Paging): Token!
  }

  # type Mutation {
  #   createToken(token: TokenInput!): Token!
  # }
`;
export default typeDefs;
