import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-footer-admin',
  imports: [],
  templateUrl: './footer-admin.html',
  styleUrl: './footer-admin.css'
})
export class FooterAdmin implements AfterViewInit  {
  @ViewChild('btnScrollFooter') btnScrollFooter!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit() {
    // Mostrar u ocultar el botón según scroll
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      this.btnScrollFooter.nativeElement.style.display = scrollTop > 200 ? 'block' : 'none';
    });

    // Scroll al inicio al hacer click
    this.btnScrollFooter.nativeElement.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
