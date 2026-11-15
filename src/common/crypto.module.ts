import { Global, Module } from "@nestjs/common";
import { CryptoService } from "@/common/crypto.service.js";

@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}