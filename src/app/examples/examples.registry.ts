import { ExampleManifest } from '../core/models/example-manifest.model';
import { MANIFEST as M01 } from './01-setinterval-counter/manifest';
import { MANIFEST as M02 } from './02-main-thread/manifest';
import { MANIFEST as M03 } from './03-basic-communication/manifest';
import { MANIFEST as M04 } from './04-offloading-computation/manifest';
import { MANIFEST as M05 } from './05-transferable-objects/manifest';
import { MANIFEST as M06 } from './06-error-handling/manifest';
import { MANIFEST as M07 } from './07-shared-worker/manifest';
import { MANIFEST as M08 } from './08-lifecycle-termination/manifest';
import { MANIFEST as M09 } from './09-worker-limits/manifest';
import { MANIFEST as M10 } from './10-worker-pool/manifest';

/**
 * Central registry of all examples. To add a new example:
 *   1. Create a folder under src/app/examples/ with a manifest.ts
 *   2. Import the MANIFEST here and append it to the array
 *   3. No other files need to be modified
 */
export const EXAMPLES_REGISTRY: ExampleManifest[] = [
  M01,
  M02,
  M04,
  M03,
  M05,
  M06,
  M08,
  M07,
  M09,
  M10
];
