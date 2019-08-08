import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule', canLoad: [ AuthGuard ] },
  {
    path: 'market',
    children: [
      {
        path: '',
        canLoad: [ AuthGuard ],
        loadChildren: './market/market.module#MarketPageModule'
      },
      {
        path: 'create-order',
        canLoad: [ AuthGuard ],
        loadChildren: './market/order/create-order/create-order.module#CreateOrderPageModule'
      },
      {
        path: 'detail-order',
        canLoad: [ AuthGuard ],
        children: [
          {
            path: '',
            redirectTo: '/market',
            pathMatch: 'full'
          },
          {
            path: ':orderId',
            loadChildren: './market/order/detail-order/detail-order.module#DetailOrderPageModule'
          }
        ]
      },
    ]
  },
  { path: 'contacts', loadChildren: './contacts/contacts.module#ContactsPageModule', canLoad: [ AuthGuard ] },
  {
    path: 'assets',
    children: [
      {
        path: '',
        canLoad: [ AuthGuard ],
        loadChildren: './assets/assets.module#AssetsPageModule'
      },
      {
        path: 'asset-info',
        canLoad: [ AuthGuard ],
        children: [
          {
            path: '',
            redirectTo: '/assets',
            pathMatch: 'full'
          },
          {
            path: ':symbol',
            loadChildren: './assets/asset/asset-info/asset-info.module#AssetInfoPageModule'
          }
        ]
      },
      {
        path: 'asset-send',
        canLoad: [ AuthGuard ],
        children: [
          {
            path: '',
            redirectTo: '/assets',
            pathMatch: 'full'
          },
          {
            path: ':symbol',
            loadChildren: './assets/asset/asset-send/asset-send.module#AssetSendPageModule'
          }
        ]
      },
      {
        path: 'asset-receive',
        canLoad: [ AuthGuard ],
        children: [
          {
            path: '',
            redirectTo: '/assets',
            pathMatch: 'full'
          },
          {
            path: ':symbol',
            loadChildren: './assets/asset/asset-receive/asset-receive.module#AssetReceivePageModule'
          }
        ]
      }
    ]
  },
  { path: 'spx', loadChildren: './spx/spx.module#SpxPageModule', canLoad: [ AuthGuard ] },
  { path: 'profile', loadChildren: './profile/profile.module#ProfilePageModule', canLoad: [ AuthGuard ] },
  { path: 'about', loadChildren: './about/about.module#AboutPageModule', canLoad: [ AuthGuard ] },
  { path: 'auth', loadChildren: './auth/auth.module#AuthPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
