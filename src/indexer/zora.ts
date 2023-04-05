import axios from "axios";
import { IZoraData } from "../types/zora.js";
import { musicTokensInCollectionQuery } from "./queries.js";

export const getMusicNftsMetadataByColAddr = async (newTokens: string[]) => {
  // const response = await this.zoraClient.tokens({
  //   where: { tokens: filter },
  //   // filter: { mediaType: MediaType.Audio },
  // });
  const endpoint = "https://api.zora.co/graphql";
  const headers = {
    "content-type": "application/json",
  };
  const tokensMetadata: {
    token: IZoraData;
    marketsSummary: any;
    sales: any;
  }[] = [];
  let hasNextPage = false;
  let endCursor: string | null = null;
  do {
    try {
      const graphqlQuery: any = {
        // operationName: "fetchTokens",
        query: musicTokensInCollectionQuery,
        variables: {
          where: newTokens,
          endCursor,
        },
      };
      console.log("Trying: ", endCursor);
      const response = await axios({
        url: endpoint,
        method: "post",
        headers: headers,
        data: graphqlQuery,
      });
      const nodes = response.data.data?.tokens.nodes;
      if (nodes?.length) {
        tokensMetadata.push(...nodes);
      } else {
        break;
      }
      hasNextPage = response.data.data?.tokens.pageInfo.hasNextPage;
      endCursor = response.data.data?.tokens.pageInfo.endCursor;
    } catch (e) {
      console.log(e.message);
      console.log("Error at: ", endCursor);
      hasNextPage = true;
      await new Promise((res) =>
        setTimeout(() => {
          res("");
        }, 5000)
      );
    }
  } while (hasNextPage);

  return tokensMetadata;
};