import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AddAssetComponent } from './add-asset/add-asset.component';
import { Asset } from './asset.model';
import { AssetsService } from './assets.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.page.html',
  styleUrls: ['./assets.page.scss'],
})
export class AssetsPage implements OnInit, OnDestroy {

  assets: Asset[] = [];
  filterAssets: Asset[] = [];
  private assetSub: Subscription;

  hideZeroBal = false;

  constructor(
    private modalCtrl: ModalController,
    private assetService: AssetsService
  ) { }

  ngOnInit() {
    this.assetSub = this.assetService.assets.subscribe((assets) => {
      this.assets = assets;
      this.filterAssets = this.assets;
    });
  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
  }

  addNewAsset() {
    this.modalCtrl
    .create({
      component: AddAssetComponent,
      id: 'add-new-asset'
    })
    .then(modelEl => {
      modelEl.present();
      return modelEl.onDidDismiss();
    });
  }

  async getBalance() {
    this.assets.forEach(async (v, k) => {
      await this.assetService.getAssetBalance(v.symbol, v.publicKey, v.balance);
    });
  }

  hideZeroBalance() {
    this.hideZeroBal = !this.hideZeroBal;
    if (this.hideZeroBal) {
      this.filterAssets = this.assets.filter(asset => asset.balance >= 0.00000001);
    } else {
      this.filterAssets = this.assets;
    }
  }

  async doRefresh(event) {
    await this.getBalance();
    event.target.complete();
  }


}
