import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of, from } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { environment } from '../../environments/environment';

import { User } from '../auth/user.model';
import { AuthService } from '../auth/auth.service';




@Injectable({
  providedIn: 'root'
})
export class SpxService {

  private apiURL = environment.apiUrl + 'spxchain/';
  private _user = new BehaviorSubject<User>(null);

  private publicKey = '';
  private privateKey = '';
  private curve = 'secp224r1';


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getBalance(publicKey: string, balance: number) {
    console.log('service getBalance');
    return this._apiGetBalance(publicKey).then((data: any) => {
      if (Number(data.message.balance) !== Number(balance)) {
        this.updateBalance(Number(data.message.balance)).subscribe();
      }
    });

  }

  // update balance
  updateBalance(balance: number) {
    console.log('service updateBalance');
    return this.authService.user.pipe(
      take(1),
      map(user => {
        return user;
      }),
      tap(user => {
        user.lastUpdate = moment().unix();
        user.spxBalance = balance;

        this._user.next(user);
        this.authService.updateUser(user);
      })
    );

  }

  private _apiGetBalance(publicKey: string) {
    console.log('service apiGetBalance');
    return this.http.get(this.apiURL + 'balance/' + publicKey).toPromise();
  }

}
