import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';

import { AssetsService } from '../assets/assets.service';
import { Asset } from '../assets/asset.model';

import { EncryptService } from '../encrypt.service';
import { Order } from './order/order.model';
import { stringify } from '@angular/core/src/util';

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private apiURL = environment.apiUrl + 'orders/';
  orders: Order[] = [];
  user: User = null;
  originAsset: Asset = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private assetService: AssetsService,
    private encService: EncryptService
  ) { }

  getOrders() {
    const orders: Order[] = [];
    return this._apiGetOrders()
    .pipe(
      map((data: any) => {
        for (let i = 0; i <= data.message.orders.length - 1; i++) {
          const o = data.message.orders[i];
          const order: Order = {
            orderId: o.id,
            orderHash: o.headerTrx.orderHash,
            privateHash: o.headerTrx.privateHash,
            origSymbol: o.originTrx.symbol,
            origFromAddress: o.originTrx.fromAddress,
            origToAddress: o.originTrx.toAddress,
            origAmount: o.originTrx.amount,
            destSymbol: o.destTrx.symbol,
            destAddress: o.destTrx.address,
            destAmount: o.destTrx.amount,
            isAddress: o.isTrx.address,
            isAmount: o.isTrx.amount,
            isFees: o.isTrx.fees,
            spxFees: o.feeTrx.amount,
            orderStatus: o.headerTrx.orderStatus,
            lastUpdate: o.headerTrx.laststamp,
            spxId: o.spxId
          };
          orders.push(order);
        }
        return orders.sort(
          (
            (a, b) => {
              if (a.lastUpdate > b.lastUpdate) {
                return -1;
              } else if (a.lastUpdate < b.lastUpdate) {
                return 1;
              } else {
                return 0;
              }
            }
          )
        );
      })
    );
  }

  private _apiGetOrders() {
    console.log('service _apiGetOrders');
    return this.http.get(this.apiURL);
  }

  // create new order
  createOrder(origAsset: string, origFrom: string, origTo: string, origAmount: number,
  destAsset: string, destAddress: string, destAmount: number, notes: string): Observable<Order> {

    console.log('service CreateOrder');

    // get user details
    this.authService.user.subscribe(user => this.user = user);

    const msg = this.encService.decryptCJS(this.user.spxKey, this.authService.userPass);

    return this.http.get(environment.apiUrl + 'getPGPKey')
    .pipe(
      take(1),
      switchMap((result: any) => {
        if (result.type === 'success') {
          return of(result.message.pgpKey);
        }
      }),
      take(1),
      switchMap((destKey: string) => {
        return from(this.encryptMsg(this.user, destKey, msg))
        .pipe(
          take(1),
          switchMap((encryptedMsg) => {
            return of(encryptedMsg);
          })
        );
      }),
      switchMap((encMsg: string) => {
        const form = {
          'origAsset': origAsset,
          'origFrom': origFrom,
          'origTo': origTo,
          'origAmount': origAmount,
          'destAsset': destAsset,
          'destAddress': destAddress,
          'destAmount': destAmount,
          'notes': notes,
          'spxId': this.user.spxId,
          'spxKey': encMsg
        };

        console.log(form);

        return this.http.post(this.apiURL + 'create/', form, {
          headers: new HttpHeaders({
            'Content-Type':  'application/json',
          })
        })
        .pipe(
          map((result: any) => {
            if (result.type === 'success') {
              const newOrder: Order = {
                orderId: result.message.order.id,
                orderHash: result.message.order.headerTrx.orderHash,
                privateHash: result.message.order.headerTrx.privateHash,
                orderStatus: result.message.order.headerTrx.orderStatus,
                lastUpdate: result.message.order.headerTrx.laststamp,
                origSymbol: result.message.order.originTrx.symbol,
                origFromAddress: result.message.order.originTrx.fromAddress,
                origToAddress: result.message.order.originTrx.toAddress,
                origAmount: result.message.order.originTrx.amount,
                destSymbol: result.message.order.destTrx.symbol,
                destAddress: result.message.order.destTrx.address,
                destAmount: result.message.order.destTrx.amount,
                isAddress: result.message.order.isTrx.address,
                isAmount: result.message.order.isTrx.amount,
                isFees: result.message.order.isTrx.fees,
                spxFees: result.message.order.feeTrx.amount,
                spxId: result.message.order.spxId
              };
              return newOrder;
            } else {
              return;
            }
          })
        );
      })
    );

  }

  async encryptMsg(user: User, destinationKey: string, msg: string) {

    let encryptedMsg: any = '';

    const pgpPhrase = this.encService.decryptCJS(user.pgpPhrase, this.authService.userPass);
    const pgpPrivKey = this.encService.decryptCJS(user.pgpPrivKey, this.authService.userPass);

    await this.encService.encryptPGP(pgpPrivKey, pgpPhrase, destinationKey, msg)
    .then((encMsg: any) => {
      encryptedMsg = JSON.parse('[' + encMsg + ']')[0].msg;
      return encryptedMsg;
    });

    return encryptedMsg;

  }


}
