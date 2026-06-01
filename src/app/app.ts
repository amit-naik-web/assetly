import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AlertToast } from './shared/components/alert-toast/alert-toast';
import { NotificationCenter } from './shared/components/notification-center/notification-center';
import { AlertEngineService } from './features/alerts/services/alert-engine.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AlertToast,
    NotificationCenter,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(AlertEngineService);
  }
}