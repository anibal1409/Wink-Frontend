import { Component, OnInit } from '@angular/core';
import { MatExpansionPanel } from '@angular/material';
import { ActionSheetController } from '@ionic/angular';
import { Category } from '../modelos/category.model';
import { ConfiguracionPerfilService } from '../servicios/configuracion-perfil.service';
import { Item } from '../modelos/item.model';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Section } from '../modelos/section.model';

@Component({
  selector: 'app-config-perfil',
  templateUrl: './config-perfil.page.html',
  styleUrls: ['./config-perfil.page.scss'],
})
export class ConfigPerfilPage implements OnInit {

  nombre = 'John Doe';
  ordenar = true;

  idUser = 'prueba';
  data: Item[] = [];

  publicoArray = new FormArray([]);
  generalArray = new FormArray([]);
  personalArray = new FormArray([]);
  profesionalArray = new FormArray([]);
  grupoForm: FormGroup;

  grupoArray: FormArray[] = [];

  seleccionSeccion: number;
  seleccionCategoria: string;

  categories: Category[] = [];
  sections: Section[] = [];

  changeData = false;

  item: Item = new Item({
    category_id: null,
    section: null,
    value: null,
    custom: null,
    position: null,
    itemType_id: null,
    user_id: null,
    basic: false,
  });

  constructor(
    public actionSheetController: ActionSheetController,
    private configuracionPerfilService: ConfiguracionPerfilService,
    private formBuilder: FormBuilder,
    ) {
    this.categories = this.configuracionPerfilService.categories;
    this.sections = this.configuracionPerfilService.sections;
    this.grupoArray.push(this.publicoArray);
    this.grupoArray.push(this.generalArray);
    this.grupoArray.push(this.personalArray);
    this.grupoArray.push(this.profesionalArray);
    this.grupoForm = this.formBuilder.group({
      biografia: new FormControl( null, Validators.maxLength(250)),
      0: this.publicoArray,
      1: this.generalArray,
      2: this.personalArray,
      3: this.profesionalArray,
    });
    console.log('changeData', this.changeData);
  }

  MoverItem(event: any) {
    this.changeData = true;
    if (event.previousContainer === event.container) {
      const item = (event.container.data as FormArray).at(event.previousIndex);
      (event.container.data as FormArray).removeAt(event.previousIndex);
      (event.container.data as FormArray).insert(event.currentIndex, item);
    } else {
      (event.container.data as FormArray).insert(event.currentIndex,
        (event.previousContainer.data as FormArray).at(event.previousIndex));
      (event.previousContainer.data as FormArray).removeAt(event.previousIndex);
    }
  }

  onSubmit() {

    console.log('form', this.grupoForm);
    console.log('changeData', this.changeData);
    if (this.grupoForm.valid && this.changeData) {
      this.data = [];
      this.data.push(
        new Item({
          value: this.grupoForm.value.biografia,
          position: -1,
          section: new Section({_id: '-1', name: 'Biografia', key: -1}),
          })
      );
      let section;
      for (let index = 0; index < 4; index++) {
        section = this.sections.find(sectionx => sectionx.key === index);
        (this.grupoForm.value as any[])[index].forEach((valor: any, i: number) => {
          valor.item.position = i;
          valor.item.section = section;
          this.data.push(valor.item);
        });
      }
      console.log('Data', this.data);
    }
  }

  AggItem(item: Item, user: boolean) {
    this.grupoArray[item.section.key].push(
      new FormGroup({
      item: new FormControl(item)
    })
    );
    if (user) {
      this.changeData = true;
      this.item = new Item({
        category_id: null,
        section: null,
        value: null,
        custom: null,
        position: null,
        itemType_id: null,
        user_id: null,
        basic: false,
      });
    }
  }

  ngOnInit() {
    this.CargarData();
    console.log('changeData', this.changeData);
  }

  CargarData() {
    const itemPrueba = new Item(
      {
        section: new Section({_id: '1',  name: 'Publico', key: 0}),
        value: 'anibal prueba',
        custom: null,
        position: 0,
        itemType_id: '9',
        user_id: 'Anibal',
        basic: true,
      }
    );
    this.AggItem(itemPrueba, false);
  }

  Ordenar() {
    this.ordenar = !this.ordenar;
  }

  AbrirPanel(panel: MatExpansionPanel) {
    panel.open();
  }

  CerrarPanel(panel: MatExpansionPanel) {
    panel.close();
  }

  EliminarElemento(arreglo: FormArray, index: number) {
    this.changeData = true;
    arreglo.removeAt(index);
  }

  async SeleccionSeccion() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una sección',
      buttons: [
        ...this.CargarSecciones(),
        {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  async SeleccionCategoria() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una categoria',
      buttons: [
        ...this.CargarCategorias()
        , {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  CargarCategorias(): [] {
    const obj: any = [];
    for (const categoria of this.categories) {
      obj.push({
        text: categoria.name,
        icon: 'add',
        handler: () => {
          this.item.category_id = categoria._id;
          this.AggItem(this.item, true);
        }
      });
    }
    return obj;
  }

  CargarSecciones(): [] {
    const obj: any = [];
    for (const seccion of this.sections) {
      obj.push({
        text: seccion.name,
        icon: 'add',
        handler: () => {
          this.item.section = seccion;
          this.SeleccionCategoria();
        }
      });
    }
    return obj;
  }

  get publicoForm() {
    return (this.grupoForm.get('0') as FormArray);
  }

  get generalForm() {
    return (this.grupoForm.get('1') as FormArray);
  }

  get personalForm() {
    return (this.grupoForm.get('2') as FormArray);
  }

  get profesionalForm() {
    return (this.grupoForm.get('3') as FormArray);
  }

  FormValid() {
    console.log('this.changeData', this.changeData);
    // console.log('this.grupoForm.invalid', this.grupoForm.invalid);
    return this.changeData && this.grupoForm.valid;
  }

  ChangeForm() {
    this.changeData = true;
  }
}
