import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  private readonly indexKey: Buffer;

  constructor(config: ConfigService) {
    this.key = Buffer.from(
      config.getOrThrow<string>("KYC_ENCRYPTION_KEY"),
      "hex",
    );
    if (this.key.length !== 32)
      throw new Error("KYC_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
    this.indexKey = Buffer.from(
      config.getOrThrow<string>("KYC_INDEX_KEY"),
      "hex",
    );
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12); // 12 bytes is the GCM-recommended IV size
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
  }

  decrypt(payload: string): string {
    const [version, iv, tag, ct] = payload.split(":");
    if (version !== "v1")
      throw new Error(`Unsupported ciphertext version: ${version}`);

    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(ct, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }

  blindIndex(value: string): string {
    return createHmac("sha256", this.indexKey).update(value).digest("hex");
  }
}
