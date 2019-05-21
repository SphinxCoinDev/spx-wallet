import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptService {

  constructor() { }

  encrypt(msg: string, secret: string) {
    const encText = CryptoJS.AES.encrypt( msg, secret);
    return encText.toString();
  }

  decrypt(msg: string, secret: string) {
    const decText = CryptoJS.AES.decrypt( msg, secret);
    return decText.toString(CryptoJS.enc.Utf8);
  }

}
