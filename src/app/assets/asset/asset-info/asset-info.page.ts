import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { AssetsService } from '../../assets.service';
import { Asset } from '../../asset.model';
import { EncryptService } from '../../../encrypt.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-asset-info',
  templateUrl: './asset-info.page.html',
  styleUrls: ['./asset-info.page.scss'],
})
export class AssetInfoPage implements OnInit, OnDestroy {

  asset: Asset;
  private assetSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private assetService: AssetsService,
    private alertCtrl: AlertController,
    private clipboard: Clipboard,
    private toastCtrl: ToastController,
    private encService: EncryptService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('symbol')) {
        this.navCtrl.navigateBack('/assets');
        return;
      }

      this.assetSub = this.assetService.assets.subscribe((assets: Asset[]) => {
        this.asset = assets.find(asset => asset.symbol === paramMap.get('symbol'));
        this.getBalance();
      });
    });
  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
  }

  async getBalance() {
    this.assetService.getAssetBalance(this.asset.symbol, this.asset.publicKey, this.asset.balance);
  }

  async doRefresh(event) {
    await this.getBalance();
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
      header: 'Private Key',
      message: this.encService.decryptCJS(this.asset.privateKey, this.authService.userPass),
      buttons: ['OK']
    });

    await alert.present();
  }

}
