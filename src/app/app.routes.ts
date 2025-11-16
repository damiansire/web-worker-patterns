import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'examples/01-setinterval-counter',
    loadComponent: () => import('./examples/01-setinterval-counter/setinterval-counter.component').then(m => m.SetIntervalCounterComponent)
  },
  {
    path: 'examples/02-main-thread',
    loadComponent: () => import('./examples/02-main-thread/main-thread.component').then(m => m.MainThreadComponent)
  },
  {
    path: 'examples/03-basic-communication',
    loadComponent: () => import('./examples/03-basic-communication/basic-communication.component').then(m => m.BasicCommunicationComponent)
  },
  {
    path: 'examples/04-offloading-computation',
    loadComponent: () => import('./examples/04-offloading-computation/offloading-computation.component').then(m => m.OffloadingComputationComponent)
  },
  {
    path: 'examples/05-transferable-objects',
    loadComponent: () => import('./examples/05-transferable-objects/transferable-objects.component').then(m => m.TransferableObjectsComponent)
  },
  {
    path: 'examples/06-error-handling',
    loadComponent: () => import('./examples/06-error-handling/error-handling.component').then(m => m.ErrorHandlingComponent)
  },
  {
    path: 'examples/07-shared-worker',
    loadComponent: () => import('./examples/07-shared-worker/shared-worker.component').then(m => m.SharedWorkerComponent)
  },
  {
    path: 'examples/08-lifecycle-termination',
    loadComponent: () => import('./examples/08-lifecycle-termination/lifecycle-termination.component').then(m => m.LifecycleTerminationComponent)
  },
  {
    path: 'examples/09-worker-limits',
    loadComponent: () => import('./examples/09-worker-limits/worker-limits.component').then(m => m.WorkerLimitsComponent)
  },
  {
    path: 'examples/10-worker-pool',
    loadComponent: () => import('./examples/10-worker-pool/worker-pool.component').then(m => m.WorkerPoolComponent)
  }
];
