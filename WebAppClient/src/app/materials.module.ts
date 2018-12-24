import {NgModule} from '@angular/core';
import {
  MatAutocompleteModule,
  MatBadgeModule, MatBottomSheetModule,
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatDatepickerModule,
  MatDividerModule, MatExpansionModule, MatIconModule,
  MatInputModule,
  MatListModule, MatMenuModule, MatNativeDateModule, MatPaginatorModule,
  MatProgressSpinnerModule, MatRadioModule, MatRippleModule, MatSelectModule,
  MatSidenavModule, MatSliderModule, MatSlideToggleModule,
  MatSnackBarModule, MatStepperModule, MatTableModule,
  MatTabsModule,
  MatToolbarModule
} from '@angular/material';
import {NgcFloatButtonModule} from 'ngc-float-button';
import {CdkTableModule} from '@angular/cdk/table';

@NgModule({
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatRippleModule,
    MatPaginatorModule,
    MatBottomSheetModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatTableModule,
    CdkTableModule,
    NgcFloatButtonModule,
  ]
})
export class MaterialsModule {
}
