import { NgModule } from '@angular/core';
import {
  MatBadgeModule,
  MatButtonModule, MatChipsModule,
  MatDividerModule, MatIconModule,
  MatInputModule,
  MatListModule,
  MatSidenavModule,
  MatTabsModule,
  MatToolbarModule
} from '@angular/material';

@NgModule({
  imports: [
    MatInputModule,
    MatDividerModule,
    MatTabsModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
  ],
  exports:[
    MatInputModule,
    MatDividerModule,
    MatTabsModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
  ]
})
export class MaterialsModule { }
