import { describe, expect, it } from 'vitest';
import {
  AUTOMATED_PATH_PREFIX,
  countedPath,
  firstPageReferrer,
  GOATCOUNTER_ENDPOINT,
  PRODUCTION_HOST,
  pageViewHitUrl,
  shouldCountPageView,
} from './page-view.logic';

describe('shouldCountPageView', () => {
  const published = { hostname: PRODUCTION_HOST, prerender: false };

  it('cuenta las visitas al sitio publicado', () => {
    expect(shouldCountPageView(published)).toBe(true);
  });

  it('no cuenta en local ni en otros hosts', () => {
    expect(shouldCountPageView({ ...published, hostname: 'localhost' })).toBe(false);
    expect(shouldCountPageView({ ...published, hostname: '127.0.0.1' })).toBe(false);
    expect(shouldCountPageView({ ...published, hostname: 'mi-self-host.example' })).toBe(false);
  });

  it('no cuenta pestañas en prerender', () => {
    expect(shouldCountPageView({ ...published, prerender: true })).toBe(false);
  });
});

describe('countedPath', () => {
  const path = '/web-worker-patterns/t/default?x=1';

  it('deja el path de una persona tal cual', () => {
    expect(countedPath(path, false)).toBe(path);
  });

  it('pone las visitas automatizadas bajo /bot, aparte de las de personas', () => {
    expect(AUTOMATED_PATH_PREFIX).toBe('/bot');
    expect(countedPath(path, true)).toBe('/bot/web-worker-patterns/t/default?x=1');
  });
});

describe('firstPageReferrer', () => {
  const self = `https://${PRODUCTION_HOST}/web-worker-patterns/`;

  it('usa el referrer del documento cuando no hubo recarga', () => {
    expect(firstPageReferrer('https://x.com/post', null, PRODUCTION_HOST)).toBe(
      'https://x.com/post',
    );
  });

  it('tras la recarga del coi-serviceworker recupera el referrer original', () => {
    expect(firstPageReferrer(self, 'https://x.com/post', PRODUCTION_HOST)).toBe(
      'https://x.com/post',
    );
  });

  it('descarta referrers del propio sitio, vacíos o inválidos', () => {
    expect(firstPageReferrer(self, null, PRODUCTION_HOST)).toBe('');
    expect(firstPageReferrer(self, '', PRODUCTION_HOST)).toBe('');
    expect(firstPageReferrer('', null, PRODUCTION_HOST)).toBe('');
  });
});

describe('pageViewHitUrl', () => {
  const view = {
    path: '/web-worker-patterns/t/story',
    title: 'Mastering Web Workers',
    referrer: '',
    screenWidth: 1280,
  };

  it('apunta al endpoint de GoatCounter con path, título y ancho', () => {
    const url = new URL(pageViewHitUrl(view));
    expect(`${url.origin}${url.pathname}`).toBe(GOATCOUNTER_ENDPOINT);
    expect(url.searchParams.get('p')).toBe('/web-worker-patterns/t/story');
    expect(url.searchParams.get('t')).toBe('Mastering Web Workers');
    expect(url.searchParams.get('s')).toBe('1280');
  });

  it('omite el referrer vacío y codifica el que viene', () => {
    expect(new URL(pageViewHitUrl(view)).searchParams.has('r')).toBe(false);
    const withRef = new URL(pageViewHitUrl({ ...view, referrer: 'https://x.com/a?b=1&c=2' }));
    expect(withRef.searchParams.get('r')).toBe('https://x.com/a?b=1&c=2');
  });
});
