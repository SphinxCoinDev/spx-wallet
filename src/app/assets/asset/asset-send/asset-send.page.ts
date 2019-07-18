import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
// https://www.freakyjolly.com/ionic-4-add-barcode-qr-code-scanner-encoder-ionic-4-native-plugin/
import { BarcodeScannerOptions, BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Subscription } from 'rxjs';
import { AssetsService } from '../../assets.service';
import { Asset } from '../../asset.model';
import { AuthService } from '../../../auth/auth.service';
import { EncryptService } from '../../../encrypt.service';
import { LookupComponent } from '../../../contacts/contact/lookup/lookup.component';


@Component({
  selector: 'app-asset-send',
  templateUrl: './asset-send.page.html',
  styleUrls: ['./asset-send.page.scss'],
})
export class AssetSendPage implements OnInit, OnDestroy {

  barcodeScannerOptions: BarcodeScannerOptions;

  form: FormGroup;
  asset: Asset;
  private assetSub: Subscription;
  qrAddress: string;

  symbol: string;
  assets = [];
  fees: number;
  submitted = false;
  assetSet = false;
  trxHash: string;

  constructor(
    private assetService: AssetsService,
    private barcodeScanner: BarcodeScanner,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private encService: EncryptService,
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
      selectedAsset: new FormControl(null, {
        updateOn: 'blur',
        // validators: [Validators.required]
      }),
      recipientAddress: new FormControl(null, {
        validators: [Validators.required]
      }),
      recipientAmount: new FormControl(null, {
        validators: [Validators.required]
      })
    });

    this.assetSub = this.assetService.assets
    .subscribe((assets: Asset[]) => {
      const result = assets.filter(asset => asset.balance > 0);
      this.assets = result;
    });

  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
    this.form.reset();
  }

  assetSelected($event) {
    this.symbol = $event.detail.value;
    this.submitted = false;
    this.trxHash = '';
    this.form.get('recipientAddress').setValue('');
    this.form.get('recipientAmount').setValue('');

    this.loadingCtrl.create({ message: 'Checking fees ...' }).then(loadingEl => {
      loadingEl.present();
      this.assetSub = this.assetService.assets.subscribe((assets: Asset[]) => {
        this.asset = assets.find(asset => asset.symbol === this.symbol);
        this.assetService.getAssetBalance(this.asset.symbol, this.asset.publicKey, this.asset.balance);
        this.assetService.getAssetFees(this.asset.symbol, this.asset.publicKey).then((result: any) => {
          this.fees = Number(result.message.fees);
          loadingEl.dismiss();
        });
        this.assetSet = true;
      });
    });

  }

  scanQR() {
    try {
      this.barcodeScanner.scan().then((data) => {
        this.qrAddress = data.text;
        this.form.get('recipientAddress').setValue(this.qrAddress);
      });
    } catch (error) {
      console.log(error);
      // this.generalProvider.showToastBottom(error);
    }
  }

  sendAll() {
    const amount = this.asset.balance - this.fees;
    this.form.get('recipientAmount').setValue(amount.toFixed(8));
  }

  lookupContact() {
    this.modalCtrl
    .create({
      component: LookupComponent,
      componentProps: { selectedAsset: this.asset },
      id: 'lookup-contact'
    })
    .then(modelEl => {
      this.form.get('recipientAddress').setValue('');
      modelEl.present();
      return modelEl.onDidDismiss();
    })
    .then(result => {
      if (result.role === 'confirm' && result.data !== '') {
        this.form.get('recipientAddress').setValue(result.data);
      } else {
        this.form.get('recipientAddress').setValue('No valid key found');
      }
    });
  }

  sendAsset() {
    this.loadingCtrl.create({ message: 'Submitting transaction ...' }).then(loadingEl => {
      loadingEl.present();
      this.assetService.createAssetTransaction(
        this.asset.symbol,
        this.encService.decryptCJS(this.asset.privateKey, this.authService.userPass),
        this.form.get('recipientAddress').value,
        this.form.get('recipientAmount').value,
        'asset'
      )
      .subscribe(
        async (data: any) => {
          if (data.type === 'success') {
            this.assetService.getAssetBalance(this.asset.symbol, this.asset.publicKey, this.asset.balance);
            this.trxHash = data.message.trxHash;
            this.submitted = true;
            loadingEl.dismiss();
          }
        },
        async (error: any) => {
          this.submitted = false;
          loadingEl.dismiss();
          const toast = await this.toastCtrl.create({
            message: error.error.message,
            position: 'bottom',
            showCloseButton: true,
            closeButtonText: 'Ok',
            color: 'danger'
          });
          toast.present();
        }
      );
    });
  }

}
