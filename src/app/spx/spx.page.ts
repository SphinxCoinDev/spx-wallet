import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { SpxService } from './spx.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';


@Component({
  selector: 'app-spx',
  templateUrl: './spx.page.html',
  styleUrls: ['./spx.page.scss'],
})
export class SpxPage implements OnInit, OnDestroy {

  private authSub: Subscription;
  isLoading = true;
  user: User = null;

  constructor(
    private spxService: SpxService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.authSub = this.authService.user.subscribe(data => {
      this.user = data;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.authSub.unsubscribe();
  }

  async getBalance() {
    this.spxService.getBalance(this.user.spxId, this.user.spxBalance);
  }

  async doRefresh(event) {
    this.isLoading = true;
    await this.getBalance();
    this.isLoading = false;
    event.target.complete();
  }


}
