import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Contact } from './contact.model';
import { ContactsService } from './contacts.service';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.page.html',
  styleUrls: ['./contacts.page.scss'],
})
export class ContactsPage implements OnInit, OnDestroy {

  contacts: Contact[] = [];
  filtered: Contact[] = [];
  contactsSub: Subscription;
  isLoading = false;

  constructor(
    private contactService: ContactsService
  ) { }

  ngOnInit() {
    this.getContacts();
  }

  ngOnDestroy() {
    this.contactsSub.unsubscribe();
  }

  getContacts() {
    this.isLoading = true;
    this.contactsSub = this.contactService.getContacts().subscribe(
      (contacts: Contact[]) => {
        this.contacts = contacts;
        this.isLoading = false;
      }
    );
  }

  async doRefresh(event: any) {
    this.getContacts();
    event.target.complete();
  }

  filterContacts(ev: any) {
    const val = ev.target.value;

    if (val && val.trim() !== '') {
      this.contacts = this.contacts.filter((contact) => {
        return (contact.username.toLowerCase().indexOf(val.toLowerCase()) > -1);
      });
    } else {
      this.getContacts();
    }
  }

  getContact(name: string) {
    this.contactService.getContactByName(name).subscribe();
  }

}
