import { BlueboxRule, decodeWithRules, encodeWithRules } from "./bluebox";

const encryptMock = jest.fn();
const decryptMock = jest.fn();
jest.mock("./libs/aws-crypto", () => ({
  useCrypto: async () => ({
    encrypt: encryptMock,
    decrypt: decryptMock,
  }),
}));
const getMock = jest.fn();
const saveMock = jest.fn();
jest.mock("./libs/dynamodb", () => ({
  useDynamoDBData: () => ({
    save: saveMock,
    get: getMock,
  }),
}));

const mockV4 = jest.fn();
jest.mock("uuid", () => ({
  v4: () => ({
    toString: mockV4,
  }),
}));

describe("Bluebox", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockV4
      .mockReturnValueOnce("somecooluuid")
      .mockReturnValueOnce("anothercooluuid")
      .mockReturnValueOnce("thirdcooluuid")
      .mockReturnValueOnce("fourthcooluuid");
    encryptMock
      .mockResolvedValueOnce("someencryptedvalue")
      .mockResolvedValueOnce("anotherencryptedvalue")
      .mockResolvedValueOnce("thirdencryptedvalue")
      .mockResolvedValueOnce("fourthencryptedvalue");
  });
  describe("Encode", () => {
    it("must return an alias of the sensitive details defined in the rules", async () => {
      const rules: BlueboxRule[] = [
        {
          attributeName: "secret_attribute",
          type: "PAN",
          ttl: null,
        },
        {
          attributeName: "another_secret",
          type: "CVV",
          ttl: null,
        },
        {
          attributeName: "ultra_sensitive",
          type: "PAN",
          ttl: null,
        },
        {
          attributeName: "parent.child.grandchild",
          type: "PAN",
          ttl: null,
        },
      ];

      const encode = encodeWithRules({ rules });

      const body = {
        no_secret_attribute: "Hola",
        secret_attribute: "1111-2222-3333-4444",
        nested_object: {
          normal_stuff: "Colombia",
          another_secret: "547",
          another_nested: {
            ultra_sensitive: "5555 3333 2222 1111",
          },
        },
        parent: {
          child: {
            grandchild: "9999 3333 2222 8888",
          },
        },
      };

      const result = await encode(body);

      expect(result).toStrictEqual({
        no_secret_attribute: "Hola",
        secret_attribute: "111122bx_somecooluuid_bx4444",
        nested_object: {
          normal_stuff: "Colombia",
          another_secret: "bx_anothercooluuid_bx",
          another_nested: {
            ultra_sensitive: "555533bx_thirdcooluuid_bx1111",
          },
        },
        parent: {
          child: {
            grandchild: "999933bx_fourthcooluuid_bx8888",
          },
        },
      });
    });

    it("must store the encrypted data with its alias", async () => {
      const rules: BlueboxRule[] = [
        {
          attributeName: "secret_attribute",
          type: "PAN",
          ttl: null,
        },
        {
          attributeName: "another_secret",
          type: "CVV",
          ttl: null,
        },
      ];

      const encode = encodeWithRules({ rules });

      const body = {
        no_secret_attribute: "Hola",
        secret_attribute: "1234-5678-9012-8765",
        nested_object: {
          another_secret: "0876",
        },
      };

      await encode(body);

      expect(saveMock).toHaveBeenCalledTimes(2);
      expect(saveMock).toHaveBeenCalledWith(
        "bx_anothercooluuid_bx",
        "anotherencryptedvalue",
        expect.any(Number)
      );
      expect(saveMock).toHaveBeenCalledWith(
        "bx_somecooluuid_bx",
        "someencryptedvalue",
        null
      );
    });

    describe("PAN", () => {
      it("must remove the 6 first digits, last 4 digist, dashes and spaces from the sensitive data", async () => {
        const rules: BlueboxRule[] = [
          {
            attributeName: "secret_attribute",
            type: "PAN",
            ttl: null,
          },
          {
            attributeName: "another_secret",
            type: "PAN",
            ttl: null,
          },
        ];

        const encode = encodeWithRules({ rules });

        const body = {
          no_secret_attribute: "Hola",
          secret_attribute: "4583-11244-9944-11234",
          nested_object: {
            another_secret: "4321 44 2212 333",
          },
        };

        await encode(body);

        expect(encryptMock).toHaveBeenCalledTimes(2);
        expect(encryptMock).toHaveBeenCalledWith("24499441");
        expect(encryptMock).toHaveBeenCalledWith("221");
      });
    });

    describe("CVV", () => {
      let realDate: DateConstructor;
      beforeAll(() => {
        const currentDate = new Date("2022-01-30T11:25:58.111Z");
        realDate = Date;
        // @ts-ignore
        global.Date = class extends Date {
          constructor(date: Date) {
            if (date) {
              super(date);
            }

            return currentDate;
          }
        };
      });

      afterAll(() => {
        global.Date = realDate;
      });

      it("must set a 3600 TTL if not defined", async () => {
        const rules: BlueboxRule[] = [
          {
            attributeName: "secret_attribute",
            type: "PAN",
            ttl: null,
          },
          {
            attributeName: "another_secret",
            type: "CVV",
            ttl: null,
          },
        ];

        const encode = encodeWithRules({ rules });

        const body = {
          no_secret_attribute: "Hola",
          secret_attribute: "4583-11244-9944-11234",
          nested_object: {
            another_secret: "435",
          },
        };

        await encode(body);

        expect(encryptMock).toHaveBeenCalledTimes(2);
        expect(encryptMock).toHaveBeenCalledWith("24499441");
        expect(encryptMock).toHaveBeenCalledWith("435");
        expect(saveMock).toHaveBeenCalledWith(
          "bx_anothercooluuid_bx",
          "anotherencryptedvalue",
          1643545558111
        );
      });

      it("must add the TTL value to the current date", async () => {
        const ttlValue = 5800;

        const rules: BlueboxRule[] = [
          {
            attributeName: "secret_attribute",
            type: "PAN",
            ttl: null,
          },
          {
            attributeName: "another_secret",
            type: "CVV",
            ttl: ttlValue,
          },
        ];

        const expectedTTL = Math.floor(new Date().getTime() + ttlValue * 1000);

        const encode = encodeWithRules({ rules });

        const body = {
          no_secret_attribute: "Hola",
          secret_attribute: "4583-11244-9944-11234",
          nested_object: {
            another_secret: "435",
          },
        };

        await encode(body);

        expect(saveMock).toHaveBeenCalledWith(
          "bx_anothercooluuid_bx",
          "anotherencryptedvalue",
          expectedTTL
        );
      });
    });
  });

  describe("Decode", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      decryptMock
        .mockResolvedValueOnce("232323")
        .mockResolvedValueOnce("857")
        .mockResolvedValueOnce("332222");
    });

    it("must return the decoded data for each alias of the sensitive details defined in the rules", async () => {
      const rules: BlueboxRule[] = [
        {
          attributeName: "secret_attribute",
          type: "PAN",
          ttl: null,
        },
        {
          attributeName: "another_secret",
          type: "CVV",
          ttl: null,
        },
        {
          attributeName: "parent.child.grandchild",
          type: "PAN",
          ttl: null,
        },
      ];

      const decode = decodeWithRules({ rules });

      const body = {
        no_secret_attribute: "Something",
        secret_attribute: "123456bx_something_bx4444",
        nested_object: {
          normal_stuff: "Another",
          another_secret: "bx_anothersomething_bx",
        },
        parent: {
          child: {
            grandchild: "555533bx_grandchild_bx1111",
          },
        },
      };

      const result = await decode(body);

      expect(result).toStrictEqual({
        no_secret_attribute: "Something",
        secret_attribute: "1234562323234444",
        nested_object: {
          normal_stuff: "Another",
          another_secret: "857",
        },
        parent: {
          child: {
            grandchild: "5555333322221111",
          },
        },
      });
    });
  });
});
