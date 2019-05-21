import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Asset, RemoteAsset } from '../asset.model';
import { AssetsService } from '../assets.service';
import { take, map, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-asset',
  templateUrl: './add-asset.component.html',
  styleUrls: ['./add-asset.component.scss'],
})
export class AddAssetComponent implements OnInit, OnDestroy {

  form: FormGroup;

  address: string;
  privateKey: string;
  genSuccess = false;
  asset: Asset = null;

  remoteAssets: RemoteAsset[] = [];
  private remoteSub: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private assetService: AssetsService,
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      selectedAsset: new FormControl(null, {
        updateOn: 'blur',
        // validators: [Validators.required]
      })
    });

    this.getRemoteAssetsList();
  }

  ngOnDestroy() {
    this.remoteSub.unsubscribe();
  }

  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel', 'add-new-asset');
  }

  getRemoteAssetsList() {
    this.remoteSub = this.assetService.apiGetRemoteAssetsList().subscribe(
      (data: RemoteAsset[]) => {
        this.remoteAssets = data;
      }
    );
  }

  generateAsset() {
    const symbol = this.form.value.selectedAsset;

    this.assetService.getAsset(symbol)
    .pipe(
      take(1),
      map(res => {
        if (res.symbol === undefined) {
          console.log('no asset');
          this.assetService.apiGenerateAsset(symbol).subscribe(asset => {
            this.asset = asset;
            this.genSuccess = true;
          });
        } else {
          console.log('asset exists!');
        }
      })
    )
    .subscribe();
  }

}
