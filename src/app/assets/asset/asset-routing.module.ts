import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssetPage } from './asset.page';

const routes: Routes = [
    {
        path: 'tabs',
        component: AssetPage,
        children: [
            {
                path: 'asset-send',
                children: [
                    {
                        path: '',
                        loadChildren: './asset-send/asset-send.module#AssetSendPageModule'
                    }
                ]
            },
            {
                path: 'asset-info',
                children: [
                    {
                        path: '',
                        redirectTo: '/assets',
                        pathMatch: 'full'
                    },
                    {
                        path: ':symbol',
                        loadChildren: './asset-info/asset-info.module#AssetInfoPageModule'
                    }
                ]
            },
            {
                path: 'asset-receive',
                children: [
                    {
                        path: '',
                        loadChildren: './asset-receive/asset-receive.module#AssetReceivePageModule'
                    }
                ]
            },
            {
                path: '',
                redirectTo: '/assets',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/assets',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssetRoutingModule {}

