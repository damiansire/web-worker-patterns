import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'examples/00-main-thread',
    loadComponent: () => import('./examples/00-main-thread/main-thread.component').then(m => m.MainThreadComponent)
  },
  {
    path: 'examples/01-basic-communication',
    loadComponent: () => import('./examples/01-basic-communication/basic-communication.component').then(m => m.BasicCommunicationComponent)
  },
  {
    path: 'examples/02-offloading-computation',
    loadComponent: () => import('./examples/02-offloading-computation/offloading-computation.component').then(m => m.OffloadingComputationComponent)
  },
  {
    path: 'examples/03-transferable-objects',
    loadComponent: () => import('./examples/03-transferable-objects/transferable-objects.component').then(m => m.TransferableObjectsComponent)
  },
  {
    path: 'examples/04-error-handling',
    loadComponent: () => import('./examples/04-error-handling/error-handling.component').then(m => m.ErrorHandlingComponent)
  },
  {
    path: 'examples/05-shared-worker',
    loadComponent: () => import('./examples/05-shared-worker/shared-worker.component').then(m => m.SharedWorkerComponent)
  },
  {
    path: 'examples/06-lifecycle-termination',
    loadComponent: () => import('./examples/06-lifecycle-termination/lifecycle-termination.component').then(m => m.LifecycleTerminationComponent)
  },
  {
    path: 'examples/07-worker-limits',
    loadComponent: () => import('./examples/07-worker-limits/worker-limits.component').then(m => m.WorkerLimitsComponent)
  },
  {
    path: 'examples/08-worker-pool',
    loadComponent: () => import('./examples/08-worker-pool/worker-pool.component').then(m => m.WorkerPoolComponent)
  }
];
