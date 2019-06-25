import { Component, OnInit, OnDestroy } from '@angular/core';
import { BarcodeScannerOptions, BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { Asset, RemoteAsset } from '../../../assets/asset.model';
import { Order } from '../order.model';
import { AssetsService } from '../../../assets/assets.service';
import { EncryptService } from '../../../encrypt.service';
import { MarketService } from '../../market.service';
import { AuthService } from '../../../auth/auth.service';
import { LookupComponent } from '../../../contacts/contact/lookup/lookup.component';
import { User } from '../../../auth/user.model';

@Component({
  selector: 'app-create-order',
  templateUrl: './create-order.page.html',
  styleUrls: ['./create-order.page.scss'],
})
export class CreateOrderPage implements OnInit, OnDestroy {

  barcodeScannerOptions: BarcodeScannerOptions;
  qrAddress: string;

  form: FormGroup;
  localAssets: Asset[] = [];
  origAssets: Asset[] = [];

  asset: Asset = null;
  private assetSub: Subscription;

  remoteAssets: RemoteAsset[] = [];
  private remoteSub: Subscription;

  orderCreated = false;
  newOrder: Order = null;
  trxHash = '';

  user: User = null;

  constructor(
    private assetService: AssetsService,
    private barcodeScanner: BarcodeScanner,
    private loadingCtrl: LoadingController,
    private encService: EncryptService,
    private marketService: MarketService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController

  ) {
    // Options
    this.barcodeScannerOptions = {
      showTorchButton: true,
      showFlipCameraButton: true
    };
  }

  ngOnInit() {
    this.form = new FormGroup({
      origAsset: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      origAmount: new FormControl(null, {
        validators: [Validators.required]
      }),
      destAsset: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      destAmount: new FormControl(null, {
        validators: [Validators.required]
      }),
      origTo: new FormControl(null)
    });

    this.assetSub = this.assetService.assets.subscribe((data) => {
      const result = data.filter(d => d.balance > 0);
      console.log('page assets service', data, result);
      this.localAssets = data;
      this.origAssets = result;
    });

    this.getRemoteAssets();
  }


  ngOnDestroy() {
    this.assetSub.unsubscribe();
    this.remoteSub.unsubscribe();
  }

  async getRemoteAssets() {
    this.remoteSub = this.assetService.apiGetRemoteAssetsList().subscribe(
      (data: RemoteAsset[]) => {
        this.remoteAssets = data;
      }
    );
  }

  assetSelected($event) {
    this.form.get('origAmount').setValue('');
    this.form.get('destAmount').setValue('');
    this.form.get('origTo').setValue('');
  }

  sendAll() {
    const symbol = this.form.get('origAsset').value;
    this.assetService.getAsset(symbol)
    .pipe(
      take(1),
      map(a => {
        this.asset = a;
        this.form.get('origAmount').setValue(this.asset.balance);
      })
    )
    .subscribe();
  }

  scanQR() {
    try {
      this.barcodeScanner.scan().then((data) => {
        this.qrAddress = data.text;
        this.form.get('origTo').setValue(this.qrAddress);
      });
    } catch (error) {
      console.log(error);
      // this.generalProvider.showToastBottom(error);
    }
  }

  lookupContact() {
    const origAsset = <string>this.form.get('origAsset').value;
    const oAsset = this.localAssets.find(asset => asset.symbol === origAsset);
    this.modalCtrl
    .create({
      component: LookupComponent,
      componentProps: { selectedAsset: oAsset },
      id: 'lookup-contact'
    })
    .then(modelEl => {
      this.form.get('origTo').setValue('');
      modelEl.present();
      return modelEl.onDidDismiss();
    })
    .then(result => {
      if (result.role === 'confirm' && result.data !== '') {
        this.form.get('origTo').setValue(result.data);
      } else {
        this.form.get('origTo').setValue('No valid key found');
      }
    });
  }



  createOrder() {
    const origAsset  = <string>this.form.get('origAsset').value;
    const destAsset  = <string>this.form.get('destAsset').value;
    let   origTo     = <string>this.form.get('origTo').value || '';
    const origAmount = <number>this.form.get('origAmount').value;
    const destAmount = <number>this.form.get('destAmount').value;
    const notes = '';

    let origAddress: string;
    let origKey: string;
    let destAddress: string;
    let origBalance = 0;
    let assetFees = 0;
    let trxFees = 0;
    let spxFees = 0;
    let trxAmount = 0;
    const dexFee = 0.001;
    const feeMultiplier = 4;

    if (origTo === 'No valid key found') { origTo = ''; };


    this.loadingCtrl.create({ message: 'Submitting transaction ...' }).then(loadingEl => {
      loadingEl.present();

      // getting user info
      this.authService.user.subscribe(user => this.user = user);

      // getting origin from public key
      loadingEl.message = 'Checking origin asset ...';
      const oAsset = this.localAssets.find(asset => asset.symbol === origAsset);
      origAddress = oAsset.publicKey;
      origBalance = oAsset.balance;
      origKey = this.encService.decryptCJS(oAsset.privateKey, this.authService.userPass);

      // checking balance
      loadingEl.message = 'Checking asset balance ...';
      this.assetService.apiGetAssetBalance(origAsset, origAddress, origBalance)
      .subscribe(
        balance => {
          origBalance = balance;
          console.log('origBalance', origBalance);

          // checking fees
          loadingEl.message = 'Checking fees ...';
          this.assetService.getAssetFees(origAsset).then(
            async (result: any) => {
              assetFees = Number(result.message.fees);
              trxFees = assetFees * feeMultiplier;
              spxFees = origAmount * dexFee;
              trxAmount = origAmount + trxFees + spxFees;
              // console.log(trxAmount);

              // check if balance is enough
              if (trxAmount > origBalance) {
                // console.log ('Not enough funds!!');
                loadingEl.dismiss();
                const toast = await this.toastCtrl.create({
                  message: 'Not enough funds!!!',
                  position: 'bottom',
                  showCloseButton: true,
                  closeButtonText: 'Ok',
                  color: 'danger'
                });
                toast.present();
    
                return;
              } else {
                // check if destination asset exists
                loadingEl.message = 'Checking destination asset ...';
                const dAsset = this.localAssets.find(asset => asset.symbol === destAsset);

                // if not, then create asset
                if (dAsset === undefined) {
                  loadingEl.message = 'Creating destination asset ...';
                  this.assetService.apiGenerateAsset(destAsset, this.user.spxId)
                  .subscribe(
                    newAsset => {
                      destAddress = newAsset.publicKey;

                      // create the order
                      loadingEl.message = 'Creating order ...';
                      this.marketService.createOrder(
                        origAsset, origAddress, origTo, origAmount,
                        destAsset, destAddress, destAmount, notes
                      )
                      .subscribe(
                        order => {
                          // lock funds
                          loadingEl.message = 'Locking funds ...';
                          this.assetService.createAssetTransaction(
                            origAsset, origKey, order.isAddress, order.isAmount, 'market'
                          ).subscribe(
                            () => {
                              this.form.reset();
                              loadingEl.dismiss();
                            }
                          );
                        }
                      );
                    }
                  );
                } else {

                  destAddress = dAsset.publicKey;

                  // create the order
                  loadingEl.message = 'Creating order ...';
                  this.marketService.createOrder(
                    origAsset, origAddress, origTo, origAmount,
                    destAsset, destAddress, destAmount, notes
                  )
                  .subscribe(
                    order => {
                      console.log('order', order);

                      this.newOrder = order;

                      // lock funds
                      loadingEl.message = 'Locking funds ...';
                      this.assetService.createAssetTransaction(
                        origAsset, origKey, order.isAddress, order.isAmount, 'market')
                        .subscribe((trx: any) => {
                          console.log('trx', trx);
                          this.trxHash = trx.message.trxHash;
                          this.orderCreated = true;
                          this.form.reset();
                          loadingEl.dismiss();
                        }
                      );
                    }
                  );
                }
              }
            }
          );
        }
      );
    });

  }

}
