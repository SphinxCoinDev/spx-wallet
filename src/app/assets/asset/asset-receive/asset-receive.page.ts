import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
// https://github.com/Cordobo/angularx-qrcode
import { QRCodeModule } from 'angularx-qrcode';

import { AssetsService } from '../../assets.service';
import { Asset } from '../../asset.model';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-asset-receive',
  templateUrl: './asset-receive.page.html',
  styleUrls: ['./asset-receive.page.scss'],
})
export class AssetReceivePage implements OnInit, OnDestroy {

  createdCode = null;
  private assetSub: Subscription;
  assets: Asset[];
  asset: Asset;
  qrCode: string = null;


  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private assetService: AssetsService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('symbol')) {
        this.navCtrl.navigateBack('/asset-info');
        return;
      }

      this.assetSub = this.assetService.assets
      .subscribe(
        (assets: Asset[]) => {
          this.asset = assets.find(asset => asset.symbol === paramMap.get('symbol'));
          this.qrCode = this.asset.publicKey;
        }
      );
    });
  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
  }

}
