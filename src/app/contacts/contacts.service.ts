import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Contact } from './contact.model';
import { take, switchMap, map, share } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {

  private apiURL = environment.apiUrl + 'users/';
  contacts: Contact[] = [];
  user: User = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.user.subscribe(data => {
      this.user = data;
    });
  }

  // get contacts list
  getContacts(): Observable<Contact[]> {
    console.log('service getContacts');
    return this.http.get(this.apiURL)
    .pipe(
      take(1),
      map((result: any) => {
        if (result.type === 'success') {
          const contacts: Contact[] = result.message.usersList;
          return contacts.sort(
            (a, b) => {
              if (a.username.toLowerCase() < b.username.toLowerCase()) {
                return -1;
              } else if (a.username.toLowerCase() > b.username.toLowerCase()) {
                return 1;
              } else {
                return 0;
              }
            }
          );
        } else {
          return;
        }
      })
    );
  }

  getContactByName(name: string): Observable<Contact> {
    return this.http.get(this.apiURL + 'name/' + name)
    .pipe(
      take(1),
      map((result: any) => {
        if (result.type === 'success') {
          const user: Contact = result.message.user;
          return user;
        } else {
          return;
        }
      })
    );
  }

  getContactById(spxId: string): Observable<Contact> {
    return this.http.get(this.apiURL + 'id/' + spxId)
    .pipe(
      take(1),
      map((result: any) => {
        if (result.type === 'success') {
          const user: Contact = result.message.user;
          return user;
        } else {
          return;
        }
      })
    );
  }

  getContactKey(name: string, asset: string): Observable<string> {
    return this.getContactByName(name)
    .pipe(
      take(1),
      map((user: Contact) => {
        if (user.assets !== undefined) {
          const key = user.assets.find(a => a.asset === asset).key;
          return key;
        } else {
          return '';
        }
      })
    );
  }

}
