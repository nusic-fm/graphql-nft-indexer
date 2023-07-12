// import { IZoraData } from "../types/zora";
import { getNftTransfersFromBlock } from "./moralis.js";
import { getMusicNftsMetadataByColAddr } from "./zora.js";
import Token from "../models/Token.js";
import ErrorModel from "../models/Error.js";
import Config from "../models/Config.js";
import CollectionAddressModel from "../models/CollectionAddress.js";
import mongoose from "mongoose";

export class MoralisIndexer {
  public latestBlock = 17250000; // 16500000;
  public startBlock = 17250000; //16500000;
  public breakCounter = 0;
  public stopAt = 17675000; // 17250000
  public stopProcess = false;

  async start(fromBlock?: number) {
    if (fromBlock) {
      this.latestBlock = fromBlock;
    } else {
      const configInfo = await this.getLatestBlock();
      this.latestBlock = configInfo.latestBlock;
    }
    this.stopProcess = false;
    this.startBlockCollectionWise();
  }

  async getLatestBlock() {
    const doc = await Config.findById(
      new mongoose.Types.ObjectId("642db1e411cc29a1e873fd54")
    );
    return {
      latestBlock: doc.latestBlock,
      totalBlocks: doc.totalBlocks,
      processRunning: !this.stopProcess,
    };
  }

  async getTotalNftsCount() {
    return Token.countDocuments();
  }

  async startBlockCollectionWise() {
    while (this.latestBlock <= this.stopAt && this.stopProcess === false) {
      //   console.log(
      //     "Block: ",
      //     this.latestBlock,
      //     "in progress... Total passed blocks:",
      //     this.latestBlock - this.startBlock
      //   );
      await Config.findByIdAndUpdate(
        new mongoose.Types.ObjectId("642db1e411cc29a1e873fd54"),
        {
          latestBlock: this.latestBlock,
          totalBlocks: this.latestBlock - this.startBlock,
        }
      );
      try {
        const nftTransfers = await getNftTransfersFromBlock(this.latestBlock);

        if (nftTransfers.length) {
          this.breakCounter = 0;
          const _tokenAddresses = nftTransfers
            .map((nft) => nft.token_address)
            .filter((value, index, array) => array.indexOf(value) === index);
          //   console.log("tokens length: ", _tokenAddresses.length);
          const input = await this.findNonExistingIds(_tokenAddresses);
          //   console.log("input length: ", input.length);
          if (input.length === 0) {
            this.latestBlock += 1;
            continue;
          }
          const size = 100;
          const output: string[][] = [];
          for (let i = 0; i < input.length; i += size) {
            output.push(input.slice(i, i + size));
          }
          for await (const newTokens of output) {
            // console.log("newTokens length: ", newTokens.length);
            if (newTokens.length) {
              try {
                const metadataNodes = await getMusicNftsMetadataByColAddr(
                  newTokens
                );
                // console.log("metadataNodes length: ", metadataNodes.length);
                if (metadataNodes.length) {
                  const idNodes = metadataNodes.map((n) => {
                    return {
                      ...n,
                      collectionAddress: n.token.collectionAddress,
                    };
                  });

                  await Token.insertMany(idNodes, { ordered: false });
                }
                await CollectionAddressModel.insertMany(
                  newTokens.map((t) => ({ _id: t, blockNo: this.latestBlock })),
                  { ordered: false }
                );
                // console.log("Successful");
              } catch (e: any) {
                await ErrorModel.create({
                  blockNo: this.latestBlock,
                  code: e.code,
                  message: e.message,
                  customMessage: "Handling",
                });
                // console.log("Handling Error: ", e.message);
              } finally {
                this.latestBlock += 1;
              }
            } else {
              this.latestBlock += 1;
            }
          }
        } else {
          this.latestBlock += 1;
        }
      } catch (e: any) {
        await ErrorModel.create({
          blockNo: this.latestBlock,
          code: e.code,
          message: e.message,
          customMessage: `Error with moralis api, try: ${this.breakCounter}`,
        });
        if (this.breakCounter === 5) {
          this.stopProcess = true;
          //   this.latestBlock = -1;
        } else {
          this.breakCounter += 1;
        }
      }
    }
  }
  async findNonExistingIds(ids) {
    const existingIds = await CollectionAddressModel.distinct("_id", {
      _id: { $in: ids },
    });
    return ids.filter((id) => !existingIds.includes(id));
  }
}
