import { useCrypto } from "./libs/aws-crypto";
import { useDynamoDBData } from "./libs/dynamodb";
import { v4 } from "uuid";

export type BlueboxRule = {
  attributeName: string;
  type: "PAN" | "CVV";
  ttl: number | null;
};

async function retrieveSensitiveDataForRule(
  input: any,
  rule: BlueboxRule,
  path: string
): Promise<any> {
  const ruleAttributeNameLower = rule.attributeName.toLowerCase();
  const ruleAttributePartsCount = rule.attributeName.split(".").length;
  const regexMatch = /bx_\w+_bx/g;
  const crypto = await useCrypto();

  for (const key of Object.keys(input)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (input[key] instanceof Object) {
      input[key] = await retrieveSensitiveDataForRule(
        input[key],
        rule,
        currentPath
      );
      continue;
    }

    let needsDecryption = false;

    if (ruleAttributePartsCount > 1) {
      const fullPath = `${path}.${key}`;
      needsDecryption = ruleAttributeNameLower === fullPath.toLowerCase();
    }

    needsDecryption =
      needsDecryption || key.toLowerCase() === ruleAttributeNameLower;

    if (needsDecryption) {
      const matching = input[key].match(regexMatch);

      if (matching && matching.length > 0) {
        const alias = matching[0];
        const encryptedValueFromDB = await useDynamoDBData().get(alias);
        const rawValue = await crypto.decrypt(encryptedValueFromDB);
        input[key] = input[key].replace(alias, rawValue);
      }
    }
  }

  return input;
}

async function storeSensitiveDataForRule(
  input: any,
  rule: BlueboxRule,
  path: string
): Promise<any> {
  const ruleAttributeNameLower = rule.attributeName.toLocaleLowerCase();
  const ruleAttributePartsCount = rule.attributeName.split(".").length;
  const crypto = await useCrypto();

  for (const key of Object.keys(input)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (input[key] instanceof Object) {
      input[key] = await storeSensitiveDataForRule(
        input[key],
        rule,
        currentPath
      );
      continue;
    }

    let needsEncryption = false;

    if (ruleAttributePartsCount > 1) {
      const fullPath = `${path}.${key}`;
      needsEncryption = ruleAttributeNameLower === fullPath.toLocaleLowerCase();
    }

    needsEncryption =
      needsEncryption || ruleAttributeNameLower === key.toLocaleLowerCase();

    if (needsEncryption && input[key] !== null && input[key] !== undefined) {
      const sanitisedValue =
        rule.type === "PAN" ? input[key].replace(/\D/g, "") : input[key];

      const startPan = sanitisedValue.substring(0, 6);
      const middlePan = sanitisedValue.substring(6, sanitisedValue.length - 4);
      const endPan = sanitisedValue.substring(sanitisedValue.length - 4);

      const ttl = getTTLForRule(rule);
      const alias = `bx_${v4().toString().replace(/-/g, "")}_bx`;

      input[key] = rule.type === "PAN" ? `${startPan}${alias}${endPan}` : alias;

      const encryptedValue = await crypto.encrypt(middlePan);

      await useDynamoDBData().save(alias, encryptedValue, ttl);
    }
  }

  return input;
}

function getTTLForRule(rule: BlueboxRule): number | null {
  let ttl = rule.type === "CVV" && !rule.ttl ? 3600 : rule.ttl;
  if (ttl) {
    ttl = Math.floor(new Date().getTime() + ttl * 1000);
  }

  return ttl;
}

export function encodeWithRules({ rules }: { rules: BlueboxRule[] }) {
  return async (input: any) => {
    let result: any = {};
    for (const rule of rules) {
      result = await storeSensitiveDataForRule(input, rule, "");
    }

    return { ...input, ...result };
  };
}

export function decodeWithRules({ rules }: { rules: BlueboxRule[] }) {
  return async (input: any) => {
    let result: any = {};
    for (const rule of rules) {
      result = await retrieveSensitiveDataForRule(input, rule, "");
    }

    return { ...input, ...result };
  };
}
