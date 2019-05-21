import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ContactsService } from '../../contacts.service';
import { Contact } from '../../contact.model';
import { Asset } from '../../../assets/asset.model';

@Component({
  selector: 'app-lookup',
  templateUrl: './lookup.component.html',
  styleUrls: ['./lookup.component.scss'],
})
export class LookupComponent implements OnInit {
  @Input() selectedAsset: Asset;

  contacts: Contact[] = [];
  filtered: Contact[] = [];
  contactsSub: Subscription;
  isLoading = false;

  constructor(
    private modalCtrl: ModalController,
    private contactService: ContactsService
  ) { }

  ngOnInit() {
    this.getContacts();
  }

  onCancel() {
    this.contactsSub.unsubscribe();
    this.modalCtrl.dismiss(null, 'cancel', 'lookup-contact');
  }

  getContacts() {
    this.isLoading = true;
    this.contactsSub = this.contactService.getContacts().subscribe(
      contacts => {
        this.contacts = contacts;
        this.isLoading = false;
      }
    );
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
    this.contactService.getContactKey(name, this.selectedAsset.symbol).subscribe(
      key => {
        this.contactsSub.unsubscribe();
        this.modalCtrl.dismiss(key, 'confirm', 'lookup-contact');
      }
    );
  }


}
