import {NgModule} from '@angular/core';
import {
  MatBadgeModule,
  MatButtonModule, MatCheckboxModule, MatChipsModule,
  MatDividerModule, MatExpansionModule, MatIconModule,
  MatInputModule,
  MatListModule,
  MatProgressSpinnerModule, MatRadioModule,
  MatSidenavModule,
  MatSnackBarModule,
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatRadioModule,
  ],
  exports: [
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatRadioModule,
  ]
})
export class MaterialsModule { }
