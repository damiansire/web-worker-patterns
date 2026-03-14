import { Component, input } from '@angular/core';

@Component({
  selector: 'app-key-takeaways',
  standalone: true,
  templateUrl: './key-takeaways.component.html',
  styleUrl: './key-takeaways.component.scss'
})
export class KeyTakeawaysComponent {
  readonly title = input<string>('Key Takeaways');
  readonly items = input.required<string[]>();
  readonly tip = input<string>();
}
