import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { User, SyncUser } from './user.model';
import { EncryptService } from '../encrypt.service';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { take, map } from 'rxjs/operators';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLogin = true;
  userExists = false;
  formLogin: FormGroup;
  formRegister: FormGroup;


  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private encService: EncryptService
  ) { }

  ngOnInit() {

    this.formLogin = new FormGroup({
      password: new FormControl(null, { updateOn: 'change', validators: [ Validators.required ] })
    });

    this.formRegister = new FormGroup({
      username: new FormControl('', {
        updateOn: 'change',
        validators: [
          Validators.required,
          Validators.minLength(4)
        ]
      }),
      password1: new FormControl('', { updateOn: 'change', validators: [ Validators.required, Validators.minLength(6) ] }),
      password2: new FormControl('', {
        updateOn: 'change',
        validators: [
          Validators.required,
          Validators.minLength(6),
          this.checkPasswords('password1')
        ]
      }),
      pgpPhrase: new FormControl('', {
        updateOn: 'change',
        validators: [
          Validators.required,
          Validators.minLength(12)
        ]
      }),

    });

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

  onLogin() {
    this.loadingCtrl.create({ message: 'Submitting data ...' }).then(async loadingEl => {
      loadingEl.present();
      this.authService.login(this.formLogin.get('password').value).then(res => {
        if (res) {
          this.formLogin.reset();
          this.router.navigateByUrl('/home');
          this.loadingCtrl.dismiss();
        } else {
          this.loadingCtrl.dismiss();
        }
      });
    });
  }

  onRegister() {
    const username: string = this.formRegister.get('username').value;
    const password: string = this.formRegister.get('password1').value;
    const pPhrase: string = this.formRegister.get('pgpPhrase').value;
    this.userExists = false;

    this.loadingCtrl.create({ message: 'Submitting data ...' }).then(async loadingEl => {
      loadingEl.present();
      this.authService.apiCreateUser(username).subscribe(
        (data: any) => {
          if (data.type === 'success') {
            if (data.message.userKeys) {

              const spxId = data.message.userKeys.publicKey;

              this.encService.generatePgpKeys(spxId, pPhrase)
              .then((result: string) => {

                const pgpPhrase = this.encService.encryptCJS(pPhrase, password);
                const pgpPubKey = JSON.parse(result).pubkey;
                const pgpPrivKey = this.encService.encryptCJS(JSON.parse(result).privkey, password);

                const user: User = {
                  username,
                  secret: this.encService.encryptCJS(environment.passPhrase, password),
                  spxId,
                  spxKey: this.encService.encryptCJS(data.message.userKeys.privateKey, password),
                  spxBalance: 0,
                  pgpPhrase,
                  pgpPubKey,
                  pgpPrivKey,
                  token: '',
                  tokenExpirationDate: new Date(),
                  lastUpdate: moment().unix()
                };

                this.authService.addNewUser(user);

                const syncUser: SyncUser = {
                  username,
                  spxId,
                  pgpKey: pgpPubKey,
                  assets: []
                };

                this.authService.apiSyncUser(syncUser)
                .pipe(
                  take(1),
                  map(async () => {
                    this.isLogin = true;
                    this.loadingCtrl.dismiss();
                  })
                )
                .subscribe();

              });

            } else {
              this.formRegister.controls['username'].setErrors({ 'invalid': true });
              this.userExists = true;
              this.loadingCtrl.dismiss();
            }
          }
        }
      );
    });

  }

  switchAuthMode() {
    this.formLogin.reset();
    this.formRegister.reset();
    this.isLogin = !this.isLogin;
  }
}
