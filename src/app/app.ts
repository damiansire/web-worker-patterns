import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { LanguageSelectorComponent } from './core/components/language-selector/language-selector.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, LanguageSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class App {
  protected readonly title = signal('web-worker-patterns');
}
