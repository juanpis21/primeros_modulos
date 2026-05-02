import { Component, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sobre-nosotros',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sobre-nosotros.html',
  styleUrls: ['./sobre-nosotros.scss']
})
export class SobreNosotros implements OnInit, AfterViewInit {
  showTopBtn = false;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.showTopBtn = window.scrollY > 400;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
