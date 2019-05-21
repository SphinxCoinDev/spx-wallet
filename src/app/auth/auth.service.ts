import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Plugins } from '@capacitor/core';
import { BehaviorSubject, from } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';

import { User, SyncUser } from './user.model';
import { EncryptService } from '../encrypt.service';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiURL = environment.apiUrl + 'users/';

  private _user = new BehaviorSubject<User>(null);
  private _userIsAuthenticated = false;
  private _userPass = '';


  constructor(
    private http: HttpClient,
    private encSerivce: EncryptService
  ) { }

  // reads assets from device local storage
  private _loadUserFromDevice() {
    console.log('service loadUserFromDevice');

    Plugins.Storage.get({key: 'user'}).then(data => {
      if (data.value !== null) {
        this._user.next(JSON.parse(data.value));
      }
    });
  }


  get user() {
    console.log('service get user');
    if (this._user.value === null) {
      this._loadUserFromDevice();
    }

    return this._user.asObservable().pipe(
      take(1),
      map(user => {
        if (user) {
          console.dir('user', user);
          return user;
        } else {
          return null;
        }
      })
    );
  }

  get userPass() {
    return this._userPass;
  }

  get userIsAuthenticated() {
    return this._userIsAuthenticated;
  }

  // write assets to device local storage
  private _storeUserOnDevice(user: User) {
    console.log('service storeUserOnDevice');
    Plugins.Storage.set({
      key: 'user',
      value: JSON.stringify(user)
    });
  }

  // add new user
  addNewUser(user: User) {
    console.log('service addNewUser');
    this._user.next(user);
    this._storeUserOnDevice(user);
  }

  updateUser(user: User) {
    this._user.next(user);
    this._storeUserOnDevice(user);
  }

  // login user
  login(password: string) {
    console.log('service login');

    return Plugins.Storage.get({ key: 'user' }).then(data => {
      const storedData = JSON.parse(data.value);
      const decPhrase = this.encSerivce.decrypt(storedData.secret, password);
      if (decPhrase === environment.passPhrase) {
        this._userPass = password;
        this._userIsAuthenticated = true;
        this._loadUserFromDevice();
        return storedData;
      } else {
        this._userPass = '';
        this._userIsAuthenticated = false;
        return null;
      }
    });
  }

  logout() {
    this._userPass = '';
    this._userIsAuthenticated = false;
    this._user.next(null);
  }

  // get user info
  apiGetUserInfo(username: string) {
    console.log('service apiGetUserInfo');
    return this.http
      .get(this.apiURL + username)
      .pipe(map(resData => {
        console.log(resData);
        return resData;
      }));
  }

  // api create new user
  apiCreateUser(username: string) {
    console.log('service apiCreateUser');
    return this.http.get(this.apiURL + 'create/' + username);
  }

  apiSyncUser(syncUser: SyncUser) {
    console.log('service apiSyncUser');
    return this.http.post(this.apiURL + 'sync/', syncUser, {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
      })
    })
    .pipe(
      map(resData => {
        console.log(resData);
        return resData;
      })
    );

  }

}
