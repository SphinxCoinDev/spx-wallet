import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { MarketService } from './market.service';
import { AuthService } from '../auth/auth.service';
import { Order } from './order/order.model';
import { User } from '../auth/user.model';

@Component({
  selector: 'app-market',
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss'],
})
export class MarketPage implements OnInit, OnDestroy {

  orders: Order[] = [];
  ordersSub: Subscription;
  isLoading = false;
  user: User = null;

  constructor(
    private marketService: MarketService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.user.subscribe(user => this.user = user);
    this.getOrders();
  }

  ngOnDestroy() {}

  getOrders() {
    this.isLoading = true;
    this.ordersSub = this.marketService.getOrders().subscribe(
      (orders: Order[]) => {
        this.orders = orders;
        this.isLoading = false;
      }
    );
  }

  async doRefresh(event: any) {
    this.getOrders();
    event.target.complete();
  }

}
