import { model, Schema } from "mongoose";

const tokenSchema = new Schema({
  name: String,
  address: String,
  tokenId: String,
});

export default model("Token", tokenSchema);
