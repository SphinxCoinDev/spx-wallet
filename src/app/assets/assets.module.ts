import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AssetsPage } from './assets.page';
import { AddAssetComponent } from './add-asset/add-asset.component';

const routes: Routes = [
  {
    path: '',
    component: AssetsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AssetsPage, AddAssetComponent],
  entryComponents: [AddAssetComponent]
})
export class AssetsPageModule {}
