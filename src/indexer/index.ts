// import { IZoraData } from "../types/zora";
// import { getNftTransfersFromBlock } from "./moralis";
import { getMusicNftsMetadataByColAddr } from "./zora.js";
import Token from "../models/Token.js";

export class MoralisIndexer {
  public latestBlock = 1;
  public startBlock = 0;
  public breakCounter = 0;

  //   async handleMusicNft(newMusicNft: IZoraData) {
  //     const address = newMusicNft.collectionAddress;
  //   }

  constructor() {
    this.startBlockCollectionWise();
  }

  async startBlockCollectionWise() {
    while (this.latestBlock > 0) {
      console.log(
        "Block: ",
        this.latestBlock,
        "in progress... Total passed blocks:",
        this.startBlock - this.latestBlock
      );
      try {
        // const nftTransfers = await getNftTransfersFromBlock(this.latestBlock);
        const nftTransfers = [
          {
            token_address: "0x0bc2a24ce568dad89691116d5b34deb6c203f342",
          },
          {
            token_address: "0x495f947276749ce646f68ac8c248420045cb7b5e",
          },
        ];
        if (nftTransfers.length) {
          this.breakCounter = 0;
          const newTokens: string[] = [];
          for await (const token of nftTransfers) {
            const address = token.token_address;
            // Redis Implementation
            // const key = address;
            //TODO
            // const isTokenAlreadyExists = await this.redisClient.exists(key);
            // if (isTokenAlreadyExists) {
            //   continue;
            // }
            newTokens.push(address);
          }
          if (newTokens.length) {
            // Find music NFTs
            try {
              const metadataNodes = await getMusicNftsMetadataByColAddr(
                newTokens
              );
              console.log("len", metadataNodes.length);
              if (metadataNodes.length) {
                const idNodes = metadataNodes.map((n) => ({
                  ...n,
                  platform: "catalog",
                  // _id: `${n.token.collectionAddress}:${n.token.tokenId}`,
                  collectionAddress: n.token.collectionAddress,
                }));

                await Token.insertMany(idNodes, { ordered: false });
              }
              console.log("Successful");
            } catch (e: any) {
              //TODO
              //   await logError(
              //     this.latestBlock,
              //     e.message,
              //     "Handling/Zora Error"
              //   );
              console.log("Handling Error: ", e.message);
            } finally {
              this.latestBlock -= 1;
            }
          } else {
            this.latestBlock -= 1;
          }
        } else {
          this.latestBlock -= 1;
        }
      } catch (err: any) {
        //TODO
        // await logError(this.latestBlock, err.message, "Error with moralis api");
        if (this.breakCounter === 5) {
          this.latestBlock = -1;
        } else {
          this.breakCounter += 1;
        }
        // this.latestBlock = -1;
        // console.log(
        //   "Error with moralis api at block",
        //   this.latestBlock,
        //   err.message
        // );
      }
    }
  }
}
