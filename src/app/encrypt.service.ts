import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { generateKey, KeyOptions, UserID, key, message, encrypt, decrypt } from 'openpgp';


@Injectable({
  providedIn: 'root'
})
export class EncryptService {

  constructor() { }



  // Crypto-JS functions =============================================

  // encrypt string
  encryptCJS(msg: string, secret: string) {
    const encText = CryptoJS.AES.encrypt( msg, secret);
    return encText.toString();
  }

  // decrypt string
  decryptCJS(msg: string, secret: string) {
    const decText = CryptoJS.AES.decrypt( msg, secret);
    return decText.toString(CryptoJS.enc.Utf8);
  }



  // PGP functions =============================================

  // generate PGP keys
  async generatePgpKeys(spxId: string, passphrase: string) {

    let keys = '';

    const userId: UserID = {
      name: spxId,
      email: 'user@spxtek.com'
    };

    const options: KeyOptions = {
        userIds: [ userId ],
        curve: 'secp256k1',
        passphrase
    };

    await generateKey(options)
    .then(async (key) => {
        const privkey = key.privateKeyArmored;
        const pubkey = key.publicKeyArmored;
        const revocationCertificate = key.revocationCertificate;

        keys = JSON.stringify({
            privkey,
            pubkey,
            revocationCertificate
        });

        return await keys;
    });

    return keys;

  }

  // encrypt msg
  async encryptPGP(senderKey: string, passphrase: string, recipientKey: string, msg: string) {
    let encrypted = '';

    const privKeyObj = (await key.readArmored(senderKey)).keys[0]
    await privKeyObj.decrypt(passphrase)

    const options = {
        message: message.fromText(msg),
        publicKeys: (await key.readArmored(recipientKey)).keys,
        privateKeys: [privKeyObj]
    }

    await encrypt(options)
    .then((ciphertext) => {
        encrypted = JSON.stringify({ msg: ciphertext.data });
        return encrypted;
    });

    // console.log('encText: ', encrypted);
    return encrypted;
}

// decrypt msg
  async decryptPGP(senderKey: string, recipientKey: string, passphrase: string, msg: string) {
    let decrypted: any = [];
    const privKeyObj = (await key.readArmored(recipientKey)).keys[0];
    await privKeyObj.decrypt(passphrase);

    const options = {
      message: await message.readArmored(msg),
      publicKeys: (await key.readArmored(senderKey)).keys,
      privateKeys: [privKeyObj]
    };

    await decrypt(options).then(plaintext => {
      // decrypted = JSON.stringify({ msg: plaintext.data});
      decrypted = plaintext.data;
      return decrypted;
    });

    // console.log('decText: ', decrypted);
    return decrypted;
  }



}
