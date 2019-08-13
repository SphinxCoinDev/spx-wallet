import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { AssetsService } from '../../assets.service';
import { Asset } from '../../asset.model';
import { EncryptService } from '../../../encrypt.service';
import { AuthService } from '../../../auth/auth.service';
import { take, map } from 'rxjs/operators';

@Component({
  selector: 'app-asset-info',
  templateUrl: './asset-info.page.html',
  styleUrls: ['./asset-info.page.scss'],
})
export class AssetInfoPage implements OnInit, OnDestroy {

  asset: Asset;
  private assetSub: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private assetService: AssetsService,
    private alertCtrl: AlertController,
    private clipboard: Clipboard,
    private toastCtrl: ToastController,
    private encService: EncryptService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('symbol')) {
        this.navCtrl.navigateBack('/assets');
        return;
      }

      this.assetSub = this.assetService.assets
      .subscribe(
        (assets: Asset[]) => {
          this.asset = assets.find(asset => asset.symbol === paramMap.get('symbol'));
        }
      );
    });
  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
  }

  getBalance() {
    this.loadingCtrl.create({ message: 'Checking '  + this.asset.symbol + ' balance ... ' })
    .then(loadingEl => {
      loadingEl.present();
      this.assetService.getAssetBalance(this.asset.symbol, this.asset.publicKey, this.asset.balance)
      .pipe(
        take(1),
        map(() => {
          loadingEl.dismiss();
        })
      )
      .subscribe();
    });
  }

  doRefresh(event) {
    this.getBalance();
    event.target.complete();
  }

  async copyKey() {
    // add toast to show clipboard finished
    this.clipboard.copy(this.asset.publicKey);
    const toast = await this.toastCtrl.create({
      message: 'Key copied to clipboard ...',
      duration: 2000
    });
    toast.present();
  }

  async showKey() {
    const alert = await this.alertCtrl.create({
      header: 'Keys',
      message:
      '<b>Address / Public Key:</b><br><br>' + this.asset.publicKey + '<br><br>' +
      '<b>Private Key:</b><br><br>' + this.encService.decryptCJS(this.asset.privateKey, this.authService.userPass),
      buttons: [ 'ok' ]
    });

    await alert.present();
  }

  sendFunds() {
    this.router.navigateByUrl('/assets/asset-send/' + this.asset.symbol);
  }

  receiveFunds() {
    this.router.navigateByUrl('/assets/asset-receive/' + this.asset.symbol);
  }

}
