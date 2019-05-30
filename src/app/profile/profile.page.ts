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

  path = 'spx-wallet';

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

        this.fileWrite('export-assets.json', JSON.stringify(exportData));

        this.isLoading = false;
      }
    });
  }




  async fileWrite(filename: string, data: string) {
    await this.readdir();

    Filesystem.writeFile({
      path: this.path + '/' + filename,
      data: data,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
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
      console.log('readdir ret', result);
    }).catch(async (err) => {
      console.log('readdir making dir');
      await this.mkdir();
    });
  }
  
  async mkdir() {
    await Filesystem.mkdir({
      path: this.path,
      directory: FilesystemDirectory.Documents,
      createIntermediateDirectories: true             // like mkdir -p
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
      let path = result.uri.replace('file://', '_capacitor_');
      console.log(path);
  }, (err) => {
      console.log(err);
  });
  }
  

}
