import { Routes } from '@angular/router';
import { EXAMPLES_REGISTRY } from './examples/examples.registry';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  ...EXAMPLES_REGISTRY.map(manifest => ({
    path: manifest.route.slice(1),
    loadComponent: manifest.loadComponent
  }))
];
