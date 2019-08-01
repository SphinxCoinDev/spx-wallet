import { Component, OnInit } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/user.model';
import { EncryptService } from '../../encrypt.service';
import { AssetsService } from '../../assets/assets.service';
import { take, map } from 'rxjs/operators';


@Component({
  selector: 'app-pass-change',
  templateUrl: './pass-change.component.html',
  styleUrls: ['./pass-change.component.scss'],
})
export class PassChangeComponent implements OnInit {

  formChangePass: FormGroup;
  correctPass = true;

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private encService: EncryptService,
    private assetService: AssetsService,
  ) { }

  ngOnInit() {
    this.formChangePass = new FormGroup({
      curPass: new FormControl('',  { updateOn: 'change', validators: [ Validators.required, Validators.minLength(6) ] }),
      newPass1: new FormControl('', { updateOn: 'change', validators: [ Validators.required, Validators.minLength(6) ] }),
      newPass2: new FormControl('', { updateOn: 'change', validators: [ Validators.required, Validators.minLength(6),
          this.checkPasswords('newPass1')
        ]
      })
    });
  }

  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel', 'change-password');
  }

  // check if passwords match
  checkPasswords(field_name: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
        const input = control.value;
        const isValid = control.root.value[field_name] === input;
        if (!isValid) {
          return {'checkPasswords': {isValid}};
        } else {
          return null;
        }
    };
  }

  changePassword() {
    this.loadingCtrl.create({ message: 'Re-encrypting data ...' })
    .then(async loadingEl => {
      loadingEl.present();
      this.authService.login(this.formChangePass.get('curPass').value)
      .then((user: User) => {
        if (user) {

          const newPass = this.formChangePass.get('newPass1').value;

          // decrypt user info with new password
          user.pgpPhrase = this.encService.decryptCJS(user.pgpPhrase, this.authService.userPass);
          user.pgpPrivKey = this.encService.decryptCJS(user.pgpPrivKey, this.authService.userPass);
          user.secret = this.encService.decryptCJS(user.secret, this.authService.userPass);
          user.spxKey = this.encService.decryptCJS(user.spxKey, this.authService.userPass);

          // re-encrypt user info with new password
          user.pgpPhrase = this.encService.encryptCJS(user.pgpPhrase, newPass);
          user.pgpPrivKey = this.encService.encryptCJS(user.pgpPrivKey, newPass);
          user.secret = this.encService.encryptCJS(user.secret, newPass);
          user.spxKey = this.encService.encryptCJS(user.spxKey, newPass);

          this.authService.updateUser(user);

          this.assetService.assets
          .subscribe((assets) => {
            for (let i = 0; i <= assets.length - 1; i++) {
              assets[i].privateKey = this.encService.decryptCJS(assets[i].privateKey, this.authService.userPass);
              assets[i].privateKey = this.encService.encryptCJS(assets[i].privateKey, newPass);
              this.assetService.updateAsset(assets[i].symbol, assets[i]).pipe(take(1)).subscribe();
            }
            this.formChangePass.reset();
            this.loadingCtrl.dismiss();
            this.modalCtrl.dismiss(null, 'cancel', 'change-password');
            console.log('done');
          });

        } else {
          this.correctPass = false;
          this.loadingCtrl.dismiss();
        }
      });
    });

  }

}

