import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { User, SyncAssets, SyncUser } from '../auth/user.model';
import { AuthService } from '../auth/auth.service';
import { Asset } from '../assets/asset.model';
import { AssetsService } from '../assets/assets.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {

  user: User = null;
  private userSub: Subscription;

  private assetsSub: Subscription;

  isLoading = false;

  constructor(
    private authService: AuthService,
    private assetService: AssetsService
  ) { }

  ngOnInit() {
    this.userSub = this.authService.user.subscribe(user => {
      this.user = user;
    });

  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.assetsSub.unsubscribe();
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

}
