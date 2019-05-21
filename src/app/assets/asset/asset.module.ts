import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { AssetPage } from './asset.page';
import { AssetRoutingModule } from './asset-routing.module';


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AssetRoutingModule
  ],
  declarations: [AssetPage]
})
export class AssetPageModule {}
