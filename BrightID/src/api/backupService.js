// @flow

import { create, ApiSauceInstance, ApiResponse } from 'apisauce';
import nacl from 'tweetnacl';
import {
  strToUint8Array,
  uInt8ArrayToB64,
  b64ToUrlSafeB64,
  b64ToUint8Array,
} from '@/utils/encoding';
import { obtainKeys } from '@/utils/keychain';
import { noAvatar } from '@/utils/images';
import { boxEncrypt, boxDecrypt } from '@/utils/cryptoHelper';
import store from '@/store';

let recoveryUrl = 'https://recovery.brightid.org';
let seedUrl = 'http://node.brightid.org';
if (__DEV__) {
  seedUrl = 'http://test.brightid.org';
}

class BackupService {
  recoveryApi: ApiSauceInstance;

  profileApi: ApiSauceInstance;

  constructor() {
    this.recoveryApi = create({
      baseURL: recoveryUrl,
    });
    this.profileApi = create({
      baseURL: seedUrl,
    });
  }

  static throwOnError(response: ApiResponse) {
    if (response.ok) {
      return;
    }
    if (response.data && response.data.errorMessage) {
      throw new Error(response.data.errorMessage);
    }
    throw new Error(response.problem);
  }

  async getRecovery(key1: string, key2: string) {
    let res = await this.recoveryApi.get(
      `/backups/${b64ToUrlSafeB64(key1)}/${b64ToUrlSafeB64(key2)}`,
    );
    BackupService.throwOnError(res);
    return res;
  }

  async putRecovery(key1: string, key2: string, data: string) {
    let res = await this.recoveryApi.put(
      `/backups/${b64ToUrlSafeB64(key1)}/${b64ToUrlSafeB64(key2)}`,
      {
        data,
      },
    );
    BackupService.throwOnError(res);
  }

  async getSig() {
    try {
      let { publicKey, secretKey } = store.getState().recoveryData;
      let res = await this.profileApi.get(
        `/profile/download/${b64ToUrlSafeB64(publicKey)}`,
      );
      BackupService.throwOnError(res);
      const data = res.data.data;
      if (data) {
        if (data.name) {
          // if who is helping recover has latest version
          data.name = boxDecrypt(data.encryptedName, data.signingKey, b64ToUint8Array(secretKey));
          data.photo = boxDecrypt(data.encryptedPhoto, data.signingKey, b64ToUint8Array(secretKey));
        } else {
          // if who is helping recover has older version and does not send name and photo
          data.name = 'reset your name';
          data.photo = noAvatar();
        }
      }
      return data;
    } catch (err) {
      console.warn(err);
    }
  }

  async setSig({
    id,
    name,
    photo,
    timestamp,
    signingKey,
  }: {
    id: string,
    name: string,
    photo: string,
    timestamp: string,
    signingKey: string,
  }) {
    try {
      let { username, secretKey } = await obtainKeys();

      let message = `Set Signing Key${id}${signingKey}${timestamp}`;

      let sig = uInt8ArrayToB64(
        nacl.sign.detached(strToUint8Array(message), secretKey),
      );
      let data = {
        signer: username,
        signingKey: store.getState().user.publicKey,
        sig,
        id,
        encryptedName: await boxEncrypt(name, signingKey, secretKey),
        encryptedPhoto: await boxEncrypt(photo, signingKey, secretKey)
      };

      let res = await this.profileApi.post(`/profile/upload`, {
        data,
        uuid: b64ToUrlSafeB64(signingKey),
      });
      BackupService.throwOnError(res);
    } catch (err) {
      console.warn(err);
    }
  }
}

const backupService = new BackupService();

export default backupService;
