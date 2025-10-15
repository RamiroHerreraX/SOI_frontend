import { Component } from '@angular/core';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";

@Component({
  selector: 'app-cliente',
  imports: [HeaderAdmin, FooterAdmin],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css'
})
export class Cliente {

}
