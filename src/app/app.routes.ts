import { Routes } from '@angular/router';
import { Checkout, Crear, Historia, Panel } from './screens';
import { CampaignDetail, CampaignWizard, DemoReceipt, Information } from './demo-pages';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./explorar').then((module) => module.Explorar) },
  { path: 'historia', component: Historia },
  { path: 'historia/:id', component: CampaignDetail },
  { path: 'donar', component: Checkout },
  { path: 'comprobante/:id', component: DemoReceipt },
  { path: 'crear-campana', component: CampaignWizard },
  { path: 'crear-campana/:step', component: CampaignWizard },
  { path: 'presupuesto', component: Crear },
  { path: 'mi-panel', component: Panel },
  { path: 'informacion/:topic', component: Information },
  { path: '**', component: Information },
];
