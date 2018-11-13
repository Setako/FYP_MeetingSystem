import {NgModule} from '@angular/core';
import {
  MatBadgeModule,
  MatButtonModule, MatCardModule, MatCheckboxModule, MatChipsModule,
  MatDividerModule, MatExpansionModule, MatIconModule,
  MatInputModule,
  MatListModule,
  MatProgressSpinnerModule, MatRadioModule, MatSelectModule,
  MatSidenavModule,
  MatSnackBarModule, MatStepperModule,
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
    MatCardModule,
    MatSelectModule,
    MatStepperModule,
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
    MatCardModule,
    MatSelectModule,
    MatStepperModule,

  ]
})
export class MaterialsModule { }
