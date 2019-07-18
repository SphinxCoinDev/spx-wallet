import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';
import * as moment from 'moment';

import { AssetsService } from '../assets.service';
import { Asset, RemoteAsset } from '../asset.model';
import { AuthService } from '../../auth/auth.service';
import { EncryptService } from '../../encrypt.service';
import { User } from '../../auth/user.model';

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
  user: User = null;
  private userSub: Subscription;

  remoteAssets: RemoteAsset[] = [];
  private remoteSub: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private assetService: AssetsService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private encService: EncryptService,
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      selectedAsset: new FormControl(null, {
        updateOn: 'blur',
        // validators: [Validators.required]
      })
    });

    this.getUserInfo();
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

  getUserInfo() {
    this.userSub = this.authService.user.subscribe(
      user => this.user = user
      );
  }

  generateAsset() {
    this.loadingCtrl.create({ message: 'Generating keys ...' }).then(loadingEl => {
      loadingEl.present();
      const symbol = this.form.value.selectedAsset;

      this.assetService.getAsset(symbol)
      .pipe(
        take(1),
        map(res => {
          if (res.symbol === undefined) {
            console.log('no asset');
            this.assetService.apiGenerateAsset(symbol, this.user.spxId)
            .subscribe((asset: Asset) => {
              this.asset = asset;
              this.asset.privateKey = this.encService.decryptCJS(asset.privateKey, this.authService.userPass);
              this.genSuccess = true;
              loadingEl.dismiss();
            });
          } else {
            console.log('asset exists!');
            loadingEl.dismiss();
          }
        })
      )
      .subscribe();
    });
  }

}
