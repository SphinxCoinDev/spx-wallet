import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';


import { IonicModule } from '@ionic/angular';

import { AssetSendPage } from './asset-send.page';

const routes: Routes = [
  {
    path: '',
    component: AssetSendPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  providers: [],
  declarations: [AssetSendPage]
})
export class AssetSendPageModule {}
