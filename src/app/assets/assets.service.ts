import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, pipe, Observable, from, of } from 'rxjs';
import { take, map, tap, share, switchMap } from 'rxjs/operators';
import * as moment from 'moment';

import { environment } from '../../environments/environment';
import { EncryptService } from '../encrypt.service';
import { AuthService } from '../auth/auth.service';
import { Asset, RemoteAsset } from './asset.model';
import { User } from '../auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {

  private apiURL = environment.apiUrl + 'assets/';
  private _assets = new BehaviorSubject<Asset[]>([]);
  user: User = null;
  remoteAssets: RemoteAsset[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private encService: EncryptService,
  ) { }

  // write assets to device local storage
  private _storeAssetsOnDevice() {
    console.log('service storeAssetsOnDevice');
    this.assets.subscribe(assets => {
      Plugins.Storage.set({
        key: 'assets',
        value: JSON.stringify(assets)
      });
    });
  }

  // reads assets from device local storage
  private _loadAssetsFromDevice() {
    console.log('service loadAssetsFromDevice');

    Plugins.Storage.get({ key: 'assets' })
    .then(data => {
      if (data.value !== null) {
        this._assets.next(JSON.parse(data.value));
      }
    });
  }

  // add new asset
  addNewAsset(asset: Asset) {
    console.log('service addNewAsset');
    return this.assets.pipe(
      take(1),
      tap(assets => {
        this._assets.next(assets.concat(asset));
        this._storeAssetsOnDevice();
      })
    );
  }

  // return all assets
  get assets() {
    console.log('service assets');
    if (this._assets.value.length === 0) {
      this._loadAssetsFromDevice();
    }

    return this._assets.asObservable()
    .pipe(
      map(assets => {
        return assets.sort(
          (a, b) => {
            if (a.symbol < b.symbol) {
              return -1;
            } else if (a.symbol > b.symbol) {
              return 1;
            } else {
              return 0;
            }
          }
        );
      })
    );
  }

  // return a single asset
  getAsset(symbol: string): Observable<Asset> {
    console.log('service asset');
    return this.assets.pipe(
      take(1),
      map(assets => {
        return { ...assets.find(a => a.symbol === symbol) };
      })
    );
  }

  // get remote list of available assets
  apiGetRemoteAssetsList(): Observable<RemoteAsset[]> {
    console.log('service apiGetRemoteAssetsList');
    this.remoteAssets = [];
    return this.http.get(this.apiURL).pipe(
      share(),
      map((data: any) => {
        data.message.assets.forEach((v) => {
          const asset: RemoteAsset = {
            symbol: v.symbol,
            name: v.name,
            algo: v.algo,
            chainId: v.chainId,
            rpc: v.url
          };
          this.remoteAssets.push(asset);
        });
        return this.remoteAssets;
      })
    );
  }

  // generate keys for new asset
  apiGenerateAsset(symbol: string, spxId: string): Observable<Asset> {
    console.log('service apiGenerateAsset');
    let asset: Asset = null;

    return this.http.post(this.apiURL + 'generate/' + spxId + '/' + symbol, null, {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
      })
    })
    .pipe(
      switchMap((result: any) => {
        if (result.type === 'success') {
          return of(result);
        }
      }),
      switchMap((res: any) => {
        const nodeKey = res.message.nodeKey;
        const encMsg = res.message.msg;

        return from(this.decryptMsg(nodeKey, encMsg))
        .pipe(
          take(1),
          switchMap((decryptedMsg) => {
            return of(decryptedMsg);
          })
        );
      }),
      map((decryptedMsg: any) => {
        let selectedAsset: RemoteAsset = null;
        selectedAsset = this.remoteAssets.find(a => a.symbol === symbol);

        asset = {
          symbol,
          name: selectedAsset.name,
          algo: selectedAsset.algo,
          publicKey: decryptedMsg.address,
          privateKey: this.encService.encryptCJS(decryptedMsg.privateKey, this.authService.userPass),
          logoUrl: symbol.toLowerCase() + '.png',
          balance: 0,
          lastUpdate: moment().unix()
        };

        this.addNewAsset(asset).subscribe(() => {});
        return asset;

      })
    );
  }


  // get asset balance
  getAssetBalance(symbol: string, publicKey: string, balance: number) {
    console.log('service getAssetBalance');
    return this._apiGetAssetBalance(symbol, publicKey).then((data: any) => {
      if (Number(data.message.balance) !== Number(balance)) {
        this.updateAssetBalance(symbol, Number(data.message.balance)).subscribe();
      }
    });
  }

  // update asset balance
  updateAssetBalance(symbol: string, balance: number) {
    console.log('service updateAssetBalance');
    return this.assets.pipe(
      take(1),
      map(assets => {
        const updatedAssetIndex = assets.findIndex(asset => asset.symbol === symbol);
        const updatedAsset = [...assets];
        const oldAsset = updatedAsset[updatedAssetIndex];
        updatedAsset[updatedAssetIndex] = new Asset(
          oldAsset.symbol,
          oldAsset.name,
          oldAsset.algo,
          oldAsset.logoUrl,
          oldAsset.publicKey,
          oldAsset.privateKey,
          balance,
          moment().unix()
        );

        this._assets.next(updatedAsset);
        this._storeAssetsOnDevice();
      })
    );
  }

  private _apiGetAssetBalance(symbol: string, publicKey: string) {
    console.log('service apiGetAssetBalance');
    return this.http.get(this.apiURL + 'balance?symbol=' + symbol + '&publicKey=' + publicKey).toPromise();
  }

  apiGetAssetBalance(symbol: string, publicKey: string, balance: number): Observable<number> {
    console.log('service apiGetAssetBalance');
    return this.http.get(this.apiURL + 'balance?symbol=' + symbol + '&publicKey=' + publicKey)
    .pipe(
      map((result: any) => {
        if (Number(result.message.balance) !== Number(balance)) {
          this.updateAssetBalance(symbol, Number(result.message.balance)).subscribe();
        }
        return Number(result.message.balance);
      })
    );
  }

  // get asset fees
  getAssetFees(symbol: string, publicKey: string) {
    console.log('service apiGetAssetFees');
    return this.http.get(this.apiURL + 'fees/' + symbol + '/' + publicKey).toPromise();
  }

  // create new asset transaction
  createAssetTransaction(symbol: string, senderKey: string, recipientKey: string, amount: number, type: string) {

    // get user details
    this.authService.user
    .pipe(
      take(1),
      map(user => {
        this.user = user;
      })
    )
    .subscribe();

    return this.encryptMsg(senderKey)
    .pipe(
      take(1),
      switchMap((result: any) => {
        const form = {
          'symbol': symbol,
          'spxKey': this.user.spxId,
          'senderKey': result.msg,
          'recipientKey': recipientKey,
          'amount': amount,
          'type': type
        };

        return this.http.post(this.apiURL + 'transact/', form, {
          headers: new HttpHeaders({
            'Content-Type':  'application/json',
          })
        });
      })
    );

  }

  async decryptMsg(sourceKey: string, encryptedMsg: string) {

    let msg: any = '';

    this.authService.user
    .pipe(
      take(1),
      map(user => {
        this.user = user;
      })
    )
    .subscribe();

    const pgpPhrase = this.encService.decryptCJS(this.user.pgpPhrase, this.authService.userPass);
    const pgpPrivKey = this.encService.decryptCJS(this.user.pgpPrivKey, this.authService.userPass);

    await this.encService.decryptPGP(sourceKey, pgpPrivKey, pgpPhrase, encryptedMsg)
    .then((decMsg: any) => {
      msg = JSON.parse('[' + decMsg + ']')[0];
      return msg;
    });

    return msg;

  }

  encryptMsg(encryptedMsg: string): Observable<string> {

    const pgpPhrase = this.encService.decryptCJS(this.user.pgpPhrase, this.authService.userPass);
    const pgpPrivKey = this.encService.decryptCJS(this.user.pgpPrivKey, this.authService.userPass);

    return this.http.get(environment.apiUrl + 'getPGPKey')
    .pipe(
      take(1),
      switchMap((result: any) => {
        if (result.type === 'success') {
          return of(result.message.pgpKey);
        }
      }),
      switchMap((recipientKey: string) => {
        return from(this.encService.encryptPGP(pgpPrivKey, pgpPhrase, recipientKey, encryptedMsg))
        .pipe(
          take(1),
          map((encMsg: any) => {
            return JSON.parse('[' + encMsg + ']')[0];
          })
        );
      })
    );
  }

}
