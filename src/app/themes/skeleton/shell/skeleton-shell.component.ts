import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { LanguageService } from '../../../core/services/language.service';
import { SidebarComponent } from '../../../core/layout/sidebar/sidebar.component';

/**
 * Shell del theme skeleton: reproduce el layout existente (sidebar + outlet +
 * banner de geo). El host (`App`) lo monta vía `ngComponentOutlet`; las rutas
 * renderizan su contenido dentro del `<router-outlet>`.
 */
@Component({
  selector: 'skeleton-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './skeleton-shell.component.html',
  styleUrl: './skeleton-shell.component.scss',
})
export class SkeletonShellComponent {
  private readonly router = inject(Router);
  protected readonly language = inject(LanguageService);

  protected readonly geoMessage = computed(() => {
    const n = this.language.geoNotification();
    if (!n) return null;
    const template = this.language.t<string>('geoNotification.message');
    const langLabel =
      this.language.languages.find((l) => l.code === n.languageCode)?.nativeLabel ?? n.languageCode;
    return template.replace('{country}', n.countryName).replace('{language}', langLabel);
  });

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly isHomePage = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '';
  });
}
