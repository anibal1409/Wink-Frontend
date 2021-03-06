import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { ActionSheetController, MenuController, NavController } from '@ionic/angular';
import { UpdateAvatarService } from '../../services/update-avatar.service';
import { Router, NavigationEnd } from '@angular/router';
import { RoutesAPP } from 'src/app/config/enums/routes/routesApp.enum';
import { Config } from 'src/app/config/enums/config.enum';
import { MessageError } from 'src/app/config/enums/messageError.enum';
@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit, OnDestroy {

  avatar: string = Config.AVATAR;
  user: User;
  userSusbcription = new Subscription();
  formSusbcription = new Subscription();
  form: FormGroup;
  loading = false;
  loadingAvatar = false;
  uploadAvatar = false;
  edit = false;
  genders: { value: string, description: string}[] = [];

  constructor(
    public actionSheetController: ActionSheetController,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private avatarService: UpdateAvatarService,
    private router: Router,
    private navController: NavController,
  ) {
    this.user = this.userService.User();
    this.form = this.formBuilder.group({
      firstName: new FormControl( this.user.firstName,  [Validators.required]),
      lastName: new FormControl( this.user.lastName,  [Validators.required]),
      email: new FormControl({
          value: this.user.email,
          disabled: this.DisabledEmail()
        }, [
          Validators.required,
          Validators.email
        ]),
      phoneCode: new FormControl( {
        value: this.user.phone ? this.user.phone.phoneCode : null,
        disabled: this.DisabledPhone() },  [Validators.required]),
      phoneNumber: new FormControl({
        value: this.user.phone ? this.user.phone.phoneNumber : null,
        disabled: this.DisabledPhone()}, [Validators.required]),
      birthday: new FormControl( this.user.birthday, [Validators.required]),
      gender: new FormControl( this.user.gender, [Validators.required]),
      autosave: new FormControl( this.user.autosave  ? this.user.autosave : true),
      phone: new FormControl(''),
      username: new FormControl({
          value: this.user.username ?  this.user.username : null,
          disabled: this.DisabledUsername(),
        }, [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(16),
          Validators.pattern(/^[a-zA-Z0-9_s]+$/)
        ]),
    });
    this.genders = this.userService.genders;
   }

  ngOnInit() {
    this.userSusbcription = this.userService.userChanged.subscribe(
      (data) => {
        this.user = data;
      }
    );
    this.form.valueChanges.subscribe(
      () => {
        this.edit = true;
      }
    );
  }

  ngOnDestroy(): void {
    this.userSusbcription.unsubscribe();
  }

  async onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      try {
        this.form.value.phone = {
          phoneCode: this.form.value.phoneCode,
          phoneNumber: this.form.value.phoneNumber
        };
        const response = await this.userService.UpdateDate(this.form.value);
        if (response.status === 'user updated successfully') {
          this.userService.User(response.user, true);
          this.edit = false;
          setTimeout(
            async () => {
              await this.navController.navigateRoot(
                '/' + RoutesAPP.BASE + '/' + RoutesAPP.HOME
              );
            }
            , 500);
        }
      } catch (err) {
        console.log('Error submit', err);
      }
      this.loading = false;
    }
  }

  FechaActual() {
    return new Date();
  }

  Logout() {
    this.authService.Logout();
  }

  async SeleccionarImagen() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una opcion',
      buttons: [{
        text: 'Camera',
        icon: 'camera',
        handler:  async () => {
          this.RequestImage(true);
        }
      }, {
        text: 'Gallery',
        icon: 'image',
        handler:   () => {
          this.RequestImage(false);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
    await actionSheet.present();
  }

  private async RequestImage(camera: boolean) {
    try {
      this.loadingAvatar = true;
      const respuesta: any = await this.avatarService.OpenUpdate(camera);
      this.userService.UpdateAvatar(respuesta.link);
      console.log('Respuesta imagen', respuesta);
      this.uploadAvatar = true;
    } catch (err) {
      console.log('Error SolicitudImage', err);
    }
    this.loadingAvatar = false;
  }

  FormValid() {
    if (this.user) {
      if (this.user.emptyProfile) {
        return (this.form.valid && this.uploadAvatar) ? false : true;
      } else {
        return (this.form.valid && this.edit) ? false : true;
      }
    } else {
      return true;
    }
  }

  Back() {
    setTimeout(
      async () => {
        await this.navController.navigateBack(
          '/' + RoutesAPP.BASE + '/' + RoutesAPP.CONFIGURAR_PERFIL
        );
      }
      , 500);
  }


  private DisabledEmail(): boolean {
    return (this.user.emptyProfile && this.user.email !== '') ? true : false;
  }

  private DisabledUsername(): boolean {
    return (this.user.emptyProfile && this.user.username !== '') ? true : false;
  }

  private DisabledPhone(): boolean {
    return (this.user.emptyProfile && this.user.phone && this.user.phone.phoneCode && this.user.phone.phoneNumber) ? true : false;
  }

  ErrorImagen() {
    this.user.avatarUrl = this.avatar;
  }

  MessageError(input: string) {
    console.log(this.form.controls[input].errors);
    if (this.form.controls[input].errors) {
      const obj = this.form.controls[input].errors;
      let prop;
      for (prop in obj) {
      }
      if (prop) {
        switch (prop) {
          case 'required':
            return MessageError.REQUIRED;
          case 'email':
            return MessageError.EMAIL;
          case 'minlength':
            return MessageError.MINIMUM;
          case 'maxlength':
            return MessageError.MAXIMUM;
          case 'pattern':
              return MessageError.CHARACTER;
        }
      }
    }
  }

}
