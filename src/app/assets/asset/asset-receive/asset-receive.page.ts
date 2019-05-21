import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
// https://github.com/Cordobo/angularx-qrcode
import { QRCodeModule } from 'angularx-qrcode';

import { AssetsService } from '../../assets.service';
import { Asset } from '../../asset.model';

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
  isLoaded = false;


  constructor(
    private assetService: AssetsService
  ) { }

  ngOnInit() {
    this.assetSub = this.assetService.assets.subscribe((assets: Asset[]) => {
      this.assets = assets;
    });
  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
  }

  assetSelected($event) {
    this.isLoaded = true;
    this.asset = this.assets.find(a => a.symbol === $event.detail.value);
    this.qrCode = this.asset.publicKey;
  }

}
