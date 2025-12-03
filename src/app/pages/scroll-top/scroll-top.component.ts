import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.css']
})
export class ScrollTopComponent implements AfterViewInit {
  showButton = false;
  isAtBottom = false;

  ngAfterViewInit() {
    this.updateButtonState();
  }

  @HostListener('window:resize', [])
  @HostListener('window:scroll', [])
  onWindowChange() {
    this.updateButtonState();
  }

  private updateButtonState() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    setTimeout(() => {
      this.showButton = docHeight > windowHeight + 200;
      this.isAtBottom = scrollTop + windowHeight >= docHeight - 200;
    });

  }

  scrollToggle() {
    if (this.isAtBottom) {
      // Si está abajo → subir
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Si está arriba → bajar
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const windowHeight = window.innerHeight;
      const target = Math.max(0, docHeight - windowHeight);
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  }
  
}
