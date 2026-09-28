import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslocoHttpLoader } from './transloco-loader';

describe('TranslocoHttpLoader', () => {
  let loader: TranslocoHttpLoader;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    loader = TestBed.inject(TranslocoHttpLoader);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide el JSON con ruta relativa, para que se resuelva contra <base href>', () => {
    loader.getTranslation('es').subscribe();

    const request = http.expectOne((req) => req.url.endsWith('i18n/es.json'));

    // Con barra inicial el pedido ignora el sub-path de GitHub Pages y da 404.
    expect(request.request.url).toBe('i18n/es.json');
    request.flush({});
  });
});
