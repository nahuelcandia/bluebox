//From https://github.com/aws/aws-encryption-sdk-javascript/blob/master/modules/example-node/src/kms_simple.ts
const { KmsKeyringNode, buildClient, CommitmentPolicy } = require ('@aws-crypto/client-node');

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
    //purpose: 'simple demonstration app',
    origin: process.env.KMS_REGION
}
  
module.exports.encodeSensibleData = async function(cleartext) {

    // export async function encodeSensibleData = async function(data) {
    //     return new Promise(async function(resolve, reject) {
    //         console.log('Encode sensible data');
    //         console.log(data);
    //         data = 'Bananas';
    //         resolve(data)
    //     });
    // }

    /* Encrypt the data. */
    const { result } = await encrypt(keyring, cleartext, {
        encryptionContext: context,
    })

    /* Return the values so the code can be tested. */
    return result
}

module.exports.decodeSensibleData = async function(data) { 
    // export async function  decodeSensibleData = async function(data) {
    //     return new Promise(async function(resolve, reject) {
    //         console.log('Decode sensible data');
    //         console.log(data);
    //         data = 'Petete';
    //         resolve(data)
    //     });
    // }
    /* Decrypt the data. */
    const { plaintext, messageHeader } = await decrypt(keyring, data)
    
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
    
    return plaintext
}