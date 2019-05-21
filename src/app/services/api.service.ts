import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { pipe } from '@angular/core/src/render3';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  constructor(
    private http: HttpClient
  ) { }

  getBalance(publicKey: string) {
    const url = 'https://wallet.atheios.com:8797';

    const body = {
      'jsonrpc': '2.0',
      'method': 'eth_getBalance',
      'params': [publicKey, 'latest'],
      'id': '1'
    };

    return this.callRPC(url, body).pipe(
      map((data: any) => {
        const weiDivisor = 1000000000000000000;
        const balance = data.result / weiDivisor;
        console.log(data, balance);
        return balance;
      })
    );
  }

  callRPC(url: string, body: any) {

    return this.http.post(url, body, {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
      })
    });

  }

}
