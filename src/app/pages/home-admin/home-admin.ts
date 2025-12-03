import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";
import { WelcomeEditorComponent } from "../welcome-editor/welcome-editor.component";

@Component({
  selector: 'app-home-admin',
  imports: [HeaderAdmin, FooterAdmin],
  templateUrl: './home-admin.html',
  styleUrl: './home-admin.css'
})
export class HomeAdmin {
  
  constructor(private router: Router) {}
  

  navegarA(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  


}
