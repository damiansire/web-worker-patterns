import { Component, signal, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { LanguageService } from './core/services/language.service';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class App {
  protected readonly title = signal('web-worker-patterns');
  private readonly router = inject(Router);
  protected readonly language = inject(LanguageService);

  protected readonly geoMessage = computed(() => {
    const n = this.language.geoNotification();
    if (!n) return null;
    const template = this.language.t<string>('geoNotification.message');
    const langLabel = this.language.languages.find(l => l.code === n.languageCode)?.nativeLabel ?? n.languageCode;
    return template.replace('{country}', n.countryName).replace('{language}', langLabel);
  });

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isHomePage = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '';
  });
}
