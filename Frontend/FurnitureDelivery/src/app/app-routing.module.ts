import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerDashboardComponent } from './customer/dashboard/dashboard.component';
import { DeliveryTrackingComponent } from './customer/delivery-tracking/delivery-tracking.component';

// Route guards and resolvers would be imported here

const routes: Routes = [
  { path: '', redirectTo: '/customer/dashboard', pathMatch: 'full' },
  
  // Customer routes
  { path: 'customer/dashboard', component: CustomerDashboardComponent },
  { path: 'customer/track/:id', component: DeliveryTrackingComponent },
  
  // Auth routes would go here
  
  // Driver routes would go here
  
  // Public pages would go here
  
  // Wildcard route for 404
  { path: '**', redirectTo: '/customer/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }