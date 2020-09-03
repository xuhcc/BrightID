// @flow

import CryptoJS from 'crypto-js';
import nacl from 'tweetnacl';
import { convertPublicKey, convertSecretKey } from 'ed2curve';
import {
  utf8ToUint8Array,
  uInt8ArrayToUtf8,
  uInt8ArrayToB64,
  b64ToUint8Array,
  randomKey
} from '@/utils/encoding';


export const encryptData = (dataObj, aesKey) => {
  const dataStr = JSON.stringify(dataObj);
  return CryptoJS.AES.encrypt(dataStr, aesKey).toString();
};

export const decryptData = (data, aesKey) => {
  const decrypted = CryptoJS.AES.decrypt(data, aesKey).toString(
    CryptoJS.enc.Utf8,
  );
  const decryptedObj = JSON.parse(decrypted);
  decryptedObj.aesKey = aesKey;
  return decryptedObj;
};

export const boxEncrypt = async (str: string, theirSigningKey: string, mySecretKey: string) => {
  const pub = convertPublicKey(b64ToUint8Array(theirSigningKey));
  const msg = utf8ToUint8Array(str);
  const nonce = await randomKey(24);
  const data = `${uInt8ArrayToB64(
    nacl.box(msg, b64ToUint8Array(nonce), pub, convertSecretKey(mySecretKey)),
  )}_${nonce}`;
  return data;
};

export const boxDecrypt = (str: string, theirSigningKey: string, mySecretKey: string) => {
  const pub = convertPublicKey(b64ToUint8Array(theirSigningKey));
  const msg = b64ToUint8Array(str.split('_')[0]);
  const nonce = b64ToUint8Array(str.split('_')[1]);
  const data = nacl.box.open(msg, nonce, pub, convertSecretKey(mySecretKey));
  return uInt8ArrayToUtf8(data);
};
