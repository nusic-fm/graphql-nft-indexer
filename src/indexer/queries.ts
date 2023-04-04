export const musicTokensInCollectionQuery = `#graphql
  query MyQuery($where: [String!] $endCursor: String) {
      tokens(
        where: {collectionAddresses:  $where}
        filter: {mediaType: AUDIO}
        sort: {sortKey: TOKEN_ID, sortDirection: ASC}
        pagination: {limit: 100, after: $endCursor}
        ){
        nodes{
            token {
                collectionName
                tokenId
                tokenUrlMimeType
                name
                content {
                mimeType
                url
                mediaEncoding {
                    ... on AudioEncodingTypes {
                    large
                    original
                    }
                    ... on ImageEncodingTypes {
                    large
                    poster
                    original
                    thumbnail
                    }
                    ... on VideoEncodingTypes {
                    large
                    poster
                    original
                    preview
                    thumbnail
                    }
                    ... on UnsupportedEncodingTypes {
                    __typename
                    original
                    }
                }
                size
                }
                collectionAddress
                attributes {
                displayType
                traitType
                value
                }
                description
                image {
                mediaEncoding {
                    ... on ImageEncodingTypes {
                    large
                    poster
                    original
                    thumbnail
                    }
                    ... on VideoEncodingTypes {
                    large
                    poster
                    original
                    preview
                    thumbnail
                    }
                    ... on AudioEncodingTypes {
                    large
                    original
                    }
                    ... on UnsupportedEncodingTypes {
                    __typename
                    original
                    }
                }
                mimeType
                size
                url
                }
                lastRefreshTime
                metadata
                tokenStandard
                tokenUrl
                mintInfo {
                originatorAddress
                price {
                    nativePrice {
                    currency {
                        address
                        decimals
                        name
                    }
                    decimal
                    raw
                    }
                    blockNumber
                }
                toAddress
                mintContext {
                    blockNumber
                    transactionHash
                    blockTimestamp
                }
                }
                owner
            }
            marketsSummary {
                collectionAddress
                marketAddress
                marketType
                price {
                chainTokenPrice {
                    raw
                    decimal
                    currency {
                    address
                    decimals
                    name
                    }
                }
                blockNumber
                }
                status
                tokenId
                transactionInfo {
                blockNumber
                blockTimestamp
                transactionHash
                }
            }
            sales {
                tokenId
                saleType
                sellerAddress
                saleContractAddress
                price {
                nativePrice {
                    currency {
                    address
                    decimals
                    name
                    }
                    decimal
                    raw
                }
                blockNumber
                }
                collectionAddress
                buyerAddress
                transactionInfo {
                transactionHash
                blockNumber
                blockTimestamp
                }
            }
        }
        pageInfo {
            hasNextPage
            endCursor
        }
      }
  }
    `;
