// import { IZoraData } from "../types/zora";
import { getNftTransfersFromBlock } from "./moralis.js";
import { getMusicNftsMetadataByColAddr } from "./zora.js";
import Token from "../models/Token.js";
import ErrorModel from "../models/Error.js";
import { RedisClientType } from "@redis/client";
import redis from "redis";

const REDIS_KEYS = {
  latestBlock: "latestBlock",
  totalNftsCount: "totalNftsCount",
};
export class MoralisIndexer {
  public latestBlock = 0;
  public startBlock = 16000000;
  public breakCounter = 0;
  public redisClient: RedisClientType = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  });

  async initRedis() {
    await this.redisClient.connect();
  }

  async start(fromBlock?: number) {
    await this.initRedis();
    if (fromBlock) {
      this.latestBlock = fromBlock;
    } else {
      const block = await this.getLatestBlock();
      this.latestBlock = Number(block);
    }
    this.startBlockCollectionWise();
  }

  async getLatestBlock() {
    await this.redisClient.connect();
    return this.redisClient.get(REDIS_KEYS.latestBlock);
  }

  async getTotalNftsCount() {
    return Token.countDocuments();
  }

  async startBlockCollectionWise() {
    while (this.latestBlock > 0) {
      console.log(
        "Block: ",
        this.latestBlock,
        "in progress... Total passed blocks:",
        this.startBlock - this.latestBlock
      );
      await this.redisClient.set(REDIS_KEYS.latestBlock, this.latestBlock);
      try {
        const nftTransfers = await getNftTransfersFromBlock(this.latestBlock);

        if (nftTransfers.length) {
          this.breakCounter = 0;
          const _tokenAddresses = nftTransfers
            .map((nft) => nft.token_address)
            .filter((value, index, array) => array.indexOf(value) === index);
          console.log("tokens length: ", _tokenAddresses.length);
          const replies = await this.redisClient.hmGet(
            "collectionAddress",
            _tokenAddresses
          );
          const input = [];
          replies.map((r, i) => {
            if (r === null) input.push(_tokenAddresses[i]);
          });
          console.log("input length: ", input.length);
          if (input.length === 0) {
            this.latestBlock -= 1;
            return;
          }
          // 16587149;
          const size = 100;
          const output: string[][] = [];
          for (let i = 0; i < input.length; i += size) {
            output.push(input.slice(i, i + size));
          }
          for await (const newTokens of output) {
            console.log("newTokens length: ", newTokens.length);
            if (newTokens.length) {
              try {
                console.log(newTokens);
                const metadataNodes = await getMusicNftsMetadataByColAddr(
                  newTokens
                );
                console.log("metadataNodes length: ", metadataNodes.length);
                if (metadataNodes.length) {
                  const idNodes = metadataNodes.map(async (n) => {
                    return {
                      ...n,
                      // _id: `${n.token.collectionAddress}:${n.token.tokenId}`,
                      collectionAddress: n.token.collectionAddress,
                    };
                  });

                  await Token.insertMany(idNodes, { ordered: false });
                }
                await Promise.all(
                  newTokens.map(async (n) => {
                    await this.redisClient.hSet(
                      "collectionAddress",
                      n,
                      this.latestBlock
                    );
                  })
                );
                console.log("Successful");
              } catch (e: any) {
                await ErrorModel.create({
                  blockNo: this.latestBlock,
                  code: e.code,
                  message: e.message,
                  customMessage: "Handling",
                });
                console.log("Handling Error: ", e.message);
              } finally {
                this.latestBlock -= 1;
              }
            } else {
              this.latestBlock -= 1;
            }
          }
        } else {
          this.latestBlock -= 1;
        }
      } catch (e: any) {
        await ErrorModel.create({
          blockNo: this.latestBlock,
          code: e.code,
          message: e.message,
          customMessage: `Error with moralis api, try: ${this.breakCounter}`,
        });
        if (this.breakCounter === 5) {
          this.latestBlock = -1;
        } else {
          this.breakCounter += 1;
        }
      }
    }
  }
}
