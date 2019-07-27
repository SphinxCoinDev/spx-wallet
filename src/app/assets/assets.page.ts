import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';
import { AddAssetComponent } from './add-asset/add-asset.component';
import { Asset } from './asset.model';
import { AssetsService } from './assets.service';
import { Subscription } from 'rxjs';
import { take, map } from 'rxjs/operators';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.page.html',
  styleUrls: ['./assets.page.scss'],
})
export class AssetsPage implements OnInit, OnDestroy {

  assets: Asset[] = [];
  filterAssets: Asset[] = [];
  private assetSub: Subscription;
  balanceBTC = 0;
  balanceUSD = 0;

  hideZeroBal = false;

  constructor(
    private modalCtrl: ModalController,
    private assetService: AssetsService,
    private loadingCtrl: LoadingController,
  ) { }

  ngOnInit() {
    this.assetSub = this.assetService.assets
    .pipe(
      map((assets) => {
        this.assets = assets;
        this.filterAssets = this.assets;
      })
    )
    .subscribe();

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
    this.balanceBTC = 0;
    this.balanceUSD = 0;
    this.assets.forEach(async (v, k) => {
      this.loadingCtrl.create({ message: 'Checking '  + v.symbol + ' balance ... '})
      .then(loadingEl => {
        loadingEl.present();
        this.assetService.getAssetBalance(v.symbol, v.publicKey, v.balance)
        .pipe(
          take(1),
          map((result) => {
            this.balanceBTC += result.balanceBTC;
            this.balanceUSD += result.balanceUSD;
            loadingEl.dismiss();
          })
        )
        .subscribe();
      });

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
