const { KmsKeyringNode, buildClient, CommitmentPolicy, NodeCachingMaterialsManager, getLocalCryptographicMaterialsCache } = require ('@aws-crypto/client-node');

/* This builds the client with the REQUIRE_ENCRYPT_REQUIRE_DECRYPT commitment policy,
* which enforces that this client only encrypts using committing algorithm suites
* and enforces that this client
* will only decrypt encrypted messages
* that were created with a committing algorithm suite.
* This is the default commitment policy
* if you build the client with `buildClient()`.
*/
const { encrypt, decrypt } = buildClient(
    CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
)
/* A KMS CMK is required to generate the data key.
* You need kms:GenerateDataKey permission on the CMK in generatorKeyId.
*/
const generatorKeyId = process.env.KMS_ARN;

/* Adding alternate KMS keys that can decrypt.
* Access to kms:Encrypt is required for every CMK in keyIds.
* You might list several keys in different AWS Regions.
* This allows you to decrypt the data in any of the represented Regions.
* In this example, I am using the same CMK.
* This is *only* to demonstrate how the CMK ARNs are configured.
*/
const keyIds = [
    process.env.KMS_CMK_KEYID
]

/* The KMS keyring must be configured with the desired CMKs */
const keyring = new KmsKeyringNode({ generatorKeyId, keyIds })

/* Create a cache to hold the data keys (and related cryptographic material).
   * This example uses the local cache provided by the Encryption SDK.
   * The `capacity` value represents the maximum number of entries
   * that the cache can hold.
   * To make room for an additional entry,
   * the cache evicts the oldest cached entry.
   * Both encrypt and decrypt requests count independently towards this threshold.
   * Entries that exceed any cache threshold are actively removed from the cache.
   * By default, the SDK checks one item in the cache every 60 seconds (60,000 milliseconds).
   * To change this frequency, pass in a `proactiveFrequency` value
   * as the second parameter. This value is in milliseconds.
   */
  const capacity = 100
  const cache = getLocalCryptographicMaterialsCache(capacity)

  /* maxAge is the time in milliseconds that an entry will be cached.
   * Elements are actively removed from the cache.
   */
  const maxAge = 1000 * 60

  /* The maximum amount of bytes that will be encrypted under a single data key.
   * This value is optional,
   * but you should configure the lowest value possible.
   */
  const maxBytesEncrypted = 100

  /* The maximum number of messages that will be encrypted under a single data key.
   * This value is optional,
   * but you should configure the lowest value possible.
   */
  const maxMessagesEncrypted = 10

  const cachingCMM = new NodeCachingMaterialsManager({
    backingMaterials: keyring,
    cache,
    maxAge,
    maxBytesEncrypted,
    maxMessagesEncrypted,
  })

/* Encryption context is a *very* powerful tool for controlling and managing access.
* It is ***not*** secret!
* Encrypted data is opaque.
* You can use an encryption context to assert things about the encrypted data.
* Just because you can decrypt something does not mean it is what you expect.
* For example, if you are are only expecting data from 'us-west-2',
* the origin can identify a malicious actor.
* See: https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/concepts.html#encryption-context
*/
const context = {
    stage: process.env.NODE_ENV,
    origin: process.env.KMS_REGION
}
  
module.exports.encodeSensibleData = async function(cleartext) {
    /* Encrypt the data. */
    const { result } = await encrypt(cachingCMM, cleartext, {
        encryptionContext: context,
    })
    //returns the buffer encrypted and encoded in base64
    return result.toString('base64');
}

module.exports.decodeSensibleData = async function(data) { 
    /* Decrypt the data. */
    const { plaintext, messageHeader } = await decrypt(cachingCMM, Buffer.from(data, 'base64'))
    
    /* Grab the encryption context so you can verify it. */
    const { encryptionContext } = messageHeader
    
    /* Verify the encryption context.
        * If you use an algorithm suite with signing,
        * the Encryption SDK adds a name-value pair to the encryption context that contains the public key.
        * Because the encryption context might contain additional key-value pairs,
        * do not add a test that requires that all key-value pairs match.
        * Instead, verify that the key-value pairs you expect match.
        */
    Object.entries(context).forEach(([key, value]) => {
        if (encryptionContext[key] !== value)
        throw new Error('Encryption Context does not match expected values')
    })
    //returns the plain text decoded into utf8
    return plaintext.toString('utf8')
}