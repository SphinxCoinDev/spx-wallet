import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { MarketService } from '../../market.service';
import { Order } from '../order.model';

import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../auth/user.model';

import { AssetsService } from '../../../assets/assets.service';
import { Asset } from '../../../assets/asset.model';

import { EncryptService } from '../../../encrypt.service';

import { ContactsService } from '../../../contacts/contacts.service';
import { Contact } from '../../../contacts/contact.model';

@Component({
  selector: 'app-detail-order',
  templateUrl: './detail-order.page.html',
  styleUrls: ['./detail-order.page.scss'],
})
export class DetailOrderPage implements OnInit, OnDestroy {

  isLoading = false;

  order: Order = null;
  ordersSub: Subscription;
  newOrder: Order = null;

  user: User = null;
  userSub: Subscription;

  localAssets: Asset[] = [];
  asset: Asset = null;
  assetSub: Subscription;

  contact: Contact = null;



  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private marketService: MarketService,
    private authService: AuthService,
    private assetService: AssetsService,
    private loadingCtrl: LoadingController,
    private encService: EncryptService,
    private contactService: ContactsService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('orderId')) {
        this.navCtrl.navigateBack('/market');
        return;
      }
      this.isLoading = true;

      this.userSub = this.authService.user.subscribe(
        (user: User) => {
          this.user = user;
          this.assetSub = this.assetService.assets.subscribe(
            (assets: Asset[]) => {
              this.localAssets = assets;
              this.ordersSub = this.marketService.getOrders().subscribe(
                (orders: Order[]) => {
                  this.order = orders.find(order => order.orderId === paramMap.get('orderId'));
                  this.asset = this.localAssets.find(asset => asset.symbol === this.order.origSymbol);
                  this.isLoading = false;
                }
              );
            }
          );
        }
      );
    });
  }

  ngOnDestroy() {
    this.ordersSub.unsubscribe();
    this.userSub.unsubscribe();
    this.assetSub.unsubscribe();
  }

  placeOffer() {
    const origAsset = this.order.destSymbol;
    const destAsset = this.order.origSymbol;
    let   origTo = '';                          //*** lookup user address
    const origAmount = this.order.destAmount;
    const destAmount = this.order.origAmount;
    const notes = '';

    let origAddress: string;
    let origKey: string;
    let destAddress: string;
    let origBalance = 0;
    let assetFees = 0;
    let trxFees = 0;
    let spxFees = 0;
    let trxAmount = 0;
    const dexFee = 0.001;
    const feeMultiplier = 4;

    if (origTo === 'No valid key found') { origTo = ''; }


    this.loadingCtrl.create({ message: 'Submitting transaction ...' }).then(loadingEl => {
      loadingEl.present();

      // getting origin from public key
      loadingEl.message = 'Checking origin asset ...';
      const oAsset = this.localAssets.find(asset => asset.symbol === origAsset);
      origAddress = oAsset.publicKey;
      origBalance = oAsset.balance;
      origKey = this.encService.decryptCJS(oAsset.privateKey, this.authService.userPass);

      // checking balance
      loadingEl.message = 'Checking asset balance ...';
      this.assetService.apiGetAssetBalance(origAsset, origAddress, origBalance)
      .subscribe(
        balance => {
          origBalance = balance;
          console.log('origBalance', origBalance);

          // checking fees
          loadingEl.message = 'Checking fees ...';
          this.assetService.getAssetFees(origAsset, this.asset.publicKey).then(
            (result: any) => {
              assetFees = Number(result.message.fees);
              trxFees = assetFees * feeMultiplier;
              spxFees = origAmount * dexFee;
              trxAmount = origAmount + trxFees + spxFees;
              console.log(trxAmount);

              // check if balance is enough
              if (trxAmount > origBalance) {
                console.log ('Not enough funds!!');
                loadingEl.dismiss();
                return;
              } else {
                // get origin to key
                loadingEl.message = 'Getting origin to key ...';
                this.contactService.getContactById(this.order.spxId).subscribe(
                  (contact: Contact) => {
                    origTo = contact.assets.find(a => a.asset === this.order.destSymbol).key;

                    // check if destination asset exists
                    loadingEl.message = 'Checking destination asset ...';
                    const dAsset = this.localAssets.find(asset => asset.symbol === destAsset);

                    // if not, then create asset
                    if (dAsset === undefined) {
                      loadingEl.message = 'Creating destination asset ...';
                      this.assetService.apiGenerateAsset(destAsset, this.user.spxId)
                      .subscribe(
                        newAsset => {
                          destAddress = newAsset.publicKey;
    
                          // create the order
                          loadingEl.message = 'Creating order ...';
                          this.marketService.createOrder(
                            origAsset, origAddress, origTo, origAmount,
                            destAsset, destAddress, destAmount, notes
                          )
                          .subscribe(
                            order => {
                              // lock funds
                              loadingEl.message = 'Locking funds ...';
                              this.assetService.createAssetTransaction(
                                origAsset, origKey, order.isAddress, order.isAmount, 'market'
                              ).subscribe(
                                () => {
                                  loadingEl.dismiss();
                                }
                              );
                            }
                          );
                        }
                      );
                    } else {
    
                      destAddress = dAsset.publicKey;
    
                      // create the order
                      loadingEl.message = 'Creating order ...';
                      this.marketService.createOrder(
                        origAsset, origAddress, origTo, origAmount,
                        destAsset, destAddress, destAmount, notes
                      )
                      .subscribe(
                        order => {
                          console.log('order', order);
    
                          this.newOrder = order;
    
                          // lock funds
                          loadingEl.message = 'Locking funds ...';
                          this.assetService.createAssetTransaction(
                            origAsset, origKey, order.isAddress, order.isAmount, 'market'
                          ).subscribe(
                            (trx: any) => {
                              console.log('trx', trx);
                              loadingEl.dismiss();
                            }
                          );
                        }
                      );
                    }

                  }
                );

              }
            }
          );
        }
      );
    });

  }

}
