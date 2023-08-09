import dynamoose from "dynamoose";

class BlueboxRecordNotFoundError extends Error {
  constructor(alias: string) {
    super(`Bluebox record with alias ${alias} was not found`);
  }
}

type BlueboxRecord = {
  alias: string;
  value: string;
  updatedAt: number;
  createdAt: number;
  ttl?: number | null;
};

const dynamoSDK =
  process.env.NODE_ENV === "production"
    ? new dynamoose.aws.ddb.DynamoDB({})
    : new dynamoose.aws.ddb.DynamoDB({
        endpoint: "http://localstack:4566",
        region: process.env.AWS_DEFAULT_REGION,
      });
dynamoose.aws.ddb.set(dynamoSDK);
const blueboxData = dynamoose.model(
  "bluebox",
  new dynamoose.Schema({
    alias: {
      type: String,
      hashKey: true,
    },
    value: String,
    ttl: Date,
    updatedAt: Date,
    createdAt: Date,
  }),
  {
    create: false,
  }
);

const getTTL = (ttl: number | null): number =>
  ttl ? Date.now() + ttl : Date.now() + 1000 * 60 * 60 * 24 * 30 * 12 * 10; // 10 years if no TTL

export const useDynamoDBData = () => {
  return {
    get: async (alias: string): Promise<string> => {
      const record = await blueboxData.get(alias);

      if (!record) {
        const error = new BlueboxRecordNotFoundError(alias);
        console.error(error.message);
        throw error;
      }

      return record.toJSON().value;
    },

    save: async (
      alias: string,
      value: string,
      ttl: number | null
    ): Promise<string> => {
      let record: BlueboxRecord = {
        alias,
        value,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        ttl: getTTL(ttl),
      };

      const document = new blueboxData(record);
      await document.save();

      return alias;
    },
  };
};
