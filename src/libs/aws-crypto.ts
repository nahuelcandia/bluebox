import {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
  NodeCachingMaterialsManager,
  getLocalCryptographicMaterialsCache,
  EncryptionContext,
} from "@aws-crypto/client-node";

import { KMS } from "aws-sdk";

const capacity = 100;
const maxAge = 1000 * 60;
const maxBytesEncrypted = 100;
const maxMessagesEncrypted = 10;

const { NODE_ENV, AWS_DEFAULT_REGION } = process.env;

function base64Encode(input: Buffer): string {
  return input.toString("base64");
}

function base64Decode(input: string): Buffer {
  return Buffer.from(input, "base64");
}

async function getKeyArnFromAlias(
  aliasName: string,
  region: string = "us-east-1"
): Promise<string | null> {
  const kms = new KMS({ region });

  try {
    const response = await kms.describeKey({ KeyId: aliasName }).promise();
    return response.KeyMetadata?.Arn || null;
  } catch (error) {
    console.error(`Failed to describe KMS key with alias ${aliasName}`, error);
    return null;
  }
}

export const useCrypto = async () => {
  const kmsClient =
    NODE_ENV === "production"
      ? new KMS()
      : new KMS({ endpoint: "http://localstack:4566", region: "us-east-1" });

  const keyArn = await kmsClient
    .describeKey({ KeyId: "alias/bluebox" })
    .promise();

  const keyring = new KmsKeyringNode({
    clientProvider: () => kmsClient,
    generatorKeyId: keyArn.KeyMetadata?.Arn,
  });

  const { encrypt: AWSEncrypt, decrypt: AWSDecrypt } = buildClient(
    CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
  );

  const cache = getLocalCryptographicMaterialsCache(capacity);

  const cachingCMM = new NodeCachingMaterialsManager({
    backingMaterials: keyring,
    cache,
    maxAge,
    maxBytesEncrypted,
    maxMessagesEncrypted,
  });

  const context: EncryptionContext = {
    stage: NODE_ENV!,
    origin: AWS_DEFAULT_REGION!,
  };

  return {
    encrypt: async (clearText: string): Promise<string> => {
      const { result } = await AWSEncrypt(cachingCMM, clearText, {
        encryptionContext: context,
      });

      return base64Encode(result);
    },
    decrypt: async (encryptedValue: string): Promise<string> => {
      const { plaintext, messageHeader } = await AWSDecrypt(
        cachingCMM,
        base64Decode(encryptedValue)
      );
      const { encryptionContext } = messageHeader;

      Object.entries(context).forEach(([key, value]) => {
        if (encryptionContext[key] !== value) {
          throw new Error("Encryption Context does not match expected values");
        }
      });

      return plaintext.toString("utf8");
    },
  };
};
