import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
const { Filesystem } = Plugins;

import { User, SyncAssets, SyncUser } from '../auth/user.model';
import { AuthService } from '../auth/auth.service';
import { Asset } from '../assets/asset.model';
import { AssetsService } from '../assets/assets.service';
import { EncryptService } from '../encrypt.service';



@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {

  user: User = null;
  private userSub: Subscription;

  private assetsSub: Subscription;

  private exportSub: Subscription;

  isLoading = false;

  constructor(
    private authService: AuthService,
    private assetService: AssetsService,
    private encService: EncryptService,
  ) { }

  ngOnInit() {
    this.userSub = this.authService.user.subscribe(user => {
      this.user = user;
    });

  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.assetsSub.unsubscribe();
    this.exportSub.unsubscribe();
  }

  syncUser() {

    const syncAssets: SyncAssets[] = [];
    this.isLoading = true;

    this.assetsSub = this.assetService.assets.subscribe(assets => {
      assets.forEach(asset => {
        syncAssets.push({
          'asset': asset.symbol,
          'key': asset.publicKey
        });
      });

      const syncUser: SyncUser = {
        username: this.user.username,
        spxId: this.user.spxId,
        assets: syncAssets
      };

      this.authService.apiSyncUser(syncUser).subscribe(() => {
        this.isLoading = false;
      });

    });

  }

  exportAssets() {
    this.isLoading = true;

    this.exportSub = this.assetService.assets
    .subscribe(async assets => {

      if (assets.length > 0) {
        const exportData = [];
        // console.log(this.user);

        exportData.push({
          'name': this.user.username,
          'symbol': 'SPXT',
          'password': this.authService.userPass,
          'publicKey': this.user.spxId,
          'privateKey': this.encService.decrypt(this.user.spxKey, this.authService.userPass)
        });

        assets.forEach(asset => {
          exportData.push({
            'name': asset.name,
            'symbol': asset.symbol,
            'algo': asset.algo,
            'publicKey': asset.publicKey,
            'privateKey': this.encService.decrypt(asset.privateKey, this.authService.userPass)
          });
        });

        // console.log(JSON.stringify(exportData));

        this.mkdir();
        // this.fileWrite(JSON.stringify(exportData));
        this.fileRead();
        this.readdir();
        this.getUri();

        this.isLoading = false;
      }
    });
  }


  async mkdir() {
    try {
      await Filesystem.mkdir({
        path: 'spx-wallet/secrets',
        directory: FilesystemDirectory.Documents,
        createIntermediateDirectories: true             // like mkdir -p
      })
      .then((result) => console.log(result))
      .catch((err) => console.log('mkdir', err));
    } catch(e) {
      console.error('Unable to make directory', e);
    }
  }


  fileWrite(data: string) {
    try {
      Filesystem.writeFile({
        path: 'spx-wallet/secrets/export.json',
        data: data,
        directory: FilesystemDirectory.Documents,
        encoding: FilesystemEncoding.UTF8
      });
    } catch(e) {
      console.error('Unable to write file', e);
    }
  }

  async fileRead() {
    const contents = await Filesystem.readFile({
      path: 'spx-wallet/secrets/export.json',
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
    console.log(contents);
  }

  async readdir() {
    try {
      const ret = await Filesystem.readdir({
        path: 'spx-wallet/secrets',
        directory: FilesystemDirectory.Documents
      });
      console.log('ret', ret);
    } catch(e) {
      console.error('Unable to read dir', e);
    }
  }
  
  async getUri() {
    Filesystem.getUri({
      directory: FilesystemDirectory.Documents,
      path: 'spx-wallet/secrets/export.json',
  }).then((result) => {
      console.log(result);
      let path = result.uri.replace('file://', '_capacitor_');
      console.log(path);
  }, (err) => {
      console.log(err);
  });
  }
  

}
