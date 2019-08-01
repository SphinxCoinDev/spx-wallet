import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { take, map, switchMap } from 'rxjs/operators';

import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
const { Filesystem } = Plugins;

import { ToastController, AlertController, ModalController } from '@ionic/angular';

import { User, SyncAssets, SyncUser } from '../auth/user.model';
import { AuthService } from '../auth/auth.service';
import { AssetsService } from '../assets/assets.service';
import { EncryptService } from '../encrypt.service';
import { PassChangeComponent } from './pass-change/pass-change.component';



@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {

  user: User = null;
  private userSub: Subscription;

  isLoading = false;

  path = 'spx-wallet';

  constructor(
    private authService: AuthService,
    private assetService: AssetsService,
    private encService: EncryptService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    this.userSub = this.authService.user
    .pipe(
      take(1),
      map(user => {
        this.user = user;
      })
    )
    .subscribe();
  }

  ngOnDestroy() {
      this.userSub.unsubscribe();
  }

  syncUser() {

    const syncAssets: SyncAssets[] = [];
    this.isLoading = true;

    this.assetService.assets.pipe(
      take(1),
      map(assets => {
        assets.forEach(asset => {
          syncAssets.push({
            'asset': asset.symbol,
            'key': asset.publicKey
          });
        });

        const syncUser: SyncUser = {
          username: this.user.username,
          spxId: this.user.spxId,
          pgpKey: this.user.pgpPubKey,
          assets: syncAssets
        };

        this.authService.apiSyncUser(syncUser)
        .pipe(
          take(1),
          map(async () => {
            this.isLoading = false;
            const toast = await this.toastCtrl.create({
              message: 'Account synced ...',
              duration: 1000
            });
            toast.present();
          })
        )
        .subscribe();
      })
    )
    .subscribe();

  }

  exportAssets() {
    this.isLoading = true;

    this.assetService.assets
    .pipe(
      take(1),
      map(assets => {
        const exportData = [];

        exportData.push({
          'name': this.user.username,
          'symbol': 'SPXT',
          'password': this.authService.userPass,
          'publicKey': this.user.spxId,
          'privateKey': this.encService.decryptCJS(this.user.spxKey, this.authService.userPass),
          'pgpPhrase': this.encService.decryptCJS(this.user.pgpPhrase, this.authService.userPass),
          'pgpPubKey': this.user.pgpPubKey,
          'pgpPrivKey': this.encService.decryptCJS(this.user.pgpPrivKey, this.authService.userPass)
        });

        if (assets.length > 0) {

          assets.forEach(asset => {
            exportData.push({
              'name': asset.name,
              'symbol': asset.symbol,
              'algo': asset.algo,
              'publicKey': asset.publicKey,
              'privateKey': this.encService.decryptCJS(asset.privateKey, this.authService.userPass)
            });
          });

        }

        this.fileWrite('export-assets.json', JSON.stringify(exportData))
        .then(async result => {
          this.isLoading = false;
          const toast = await this.toastCtrl.create({
            message: 'Assets exported ...',
            duration: 1000
          });
          toast.present();
        })
        .catch(async err => {
          const toast = await this.toastCtrl.create({
            message: 'Error:' + err.message,
            color: 'danger',
            duration: 2000
          });
          toast.present();
        });

      })
      )
      .subscribe();
  }

  async showSpxKey() {
    const alert = await this.alertCtrl.create({
      header: 'Private Key',
      message: this.encService.decryptCJS(this.user.spxKey, this.authService.userPass),
      buttons: ['OK']
    });

    await alert.present();
  }


  async changeUsername() {
    const alert = await this.alertCtrl.create({
      header: 'Change Username',
      inputs: [
        {
          name: 'newName',
          type: 'text',
          placeholder: this.user.username
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Change',
          handler: (alertData) => {
            this.isLoading = true;
            this.authService.apiChangeUsername(alertData.newName)
            .pipe(
              take(1),
              map((result) => {
                this.isLoading = false;
              })
            )
            .subscribe();
          }
        }
      ]
    });

    await alert.present();

  }

  changePassword() {
    this.modalCtrl
    .create({
      component: PassChangeComponent,
      id: 'change-password'
    })
    .then(modelEl => {
      modelEl.present();
      return modelEl.onDidDismiss();
    });

  }





  async fileWrite(filename: string, data: string) {
    await this.readdir();

    Filesystem.writeFile({
      path: this.path + '/' + filename,
      data: data,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    })
    .then(result => {})
    .catch(err => console.log(err));
  }

  async fileRead(filename: string) {
    const contents = await Filesystem.readFile({
      path: this.path + '/' + filename,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
    console.log(contents);
  }

  async readdir() {
    await Filesystem.readdir({
      path: this.path,
      directory: FilesystemDirectory.Documents
    }).then((result) => {
    }).catch(async (err) => {
      console.log('readdir making dir');
      await this.mkdir();
    });
  }

  async mkdir() {
    await Filesystem.mkdir({
      path: this.path,
      directory: FilesystemDirectory.Documents,
      createIntermediateDirectories: false
    })
    .then(
      (result) => console.log('mkdir', result)
    )
    .catch(
      (err) => console.log('mkdir', err)
    );
  }

  async getUri(filename: string) {
    Filesystem.getUri({
      directory: FilesystemDirectory.Documents,
      path: this.path + '/' + filename,
  }).then((result) => {
      console.log(result);
      const path = result.uri.replace('file://', '_capacitor_');
      console.log(path);
  }, (err) => {
      console.log(err);
  });
  }


}
