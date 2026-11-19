import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from './app.routes';
import { DemoStore } from './demo-store';
import { Explorar } from './explorar';
import { Checkout, Crear, Historia, Panel } from './screens';

describe('Flujos de demostración', () => {
  beforeEach(() => {
    localStorage.removeItem('voces-manos-demo-v1');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('elimina la imagen del panel y los enlaces a las secciones retiradas', async () => {
    const components: Type<unknown>[] = [Explorar, Crear, Historia, Checkout, Panel];
    for (const component of components) {
      const fixture = TestBed.createComponent(component);
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('header img[alt="Voces & Manos Brand Logo"], aside img[alt="Voces & Manos Brand Logo"]')).toBeNull();
      for (const topic of ['como-funciona', 'transparencia-y-auditoria', 'impacto-real']) {
        expect(page.querySelector(`a[href="/informacion/${topic}"]`)).toBeNull();
      }
      fixture.destroy();
    }
  });

  it.each([
    ['como-funciona', 'Página no encontrada'],
    ['transparencia-y-auditoria', 'Página no encontrada'],
    ['impacto-real', 'Página no encontrada'],
    ['criterios-de-verificacion-dni', 'Verificación de identidad'],
  ])('muestra el resultado esperado para la información %s', async (topic, expected) => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/informacion/${topic}`);
    expect(harness.routeNativeElement?.textContent).toContain(expected);
  });

  it('filtra las historias de ejemplo y conserva acceso a la destacada', async () => {
    const fixture = TestBed.createComponent(Explorar);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const button = [...page.querySelectorAll<HTMLButtonElement>('.filters button')]
      .find((item) => item.textContent?.includes('Vivienda y Reconstrucción'))!;
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelectorAll('.story-card')).toHaveLength(1);
    expect(page.querySelector('.story-card a')?.getAttribute('href')).toBe('/historia');
    expect(page.querySelector('.story-card')?.textContent).toContain('Anta');
  });

  it('actualiza el avance destacado al registrar un aporte simulado', async () => {
    const fixture = TestBed.createComponent(Explorar);
    await fixture.whenStable();
    TestBed.inject(DemoStore).addDonation({
      campaignId: 'anta', amount: 150, tip: 0, method: 'Tarjeta', message: '', anonymous: true,
    });
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.featured-progress')?.textContent).toContain('15,000');
    expect(page.querySelector('.featured-progress [role=progressbar]')?.getAttribute('aria-valuenow')).toBe('83');
  });

  it('calcula el total elegido y cambia la pestaña de mensajes', async () => {
    const fixture = TestBed.createComponent(Historia);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.pledge-chip')!.click();
    page.querySelectorAll<HTMLButtonElement>('.tip-btn')[2].click();
    expect(page.querySelector('#displayTotalPledge')!.textContent).toBe('S/ 33.00');
    page.querySelector<HTMLButtonElement>('#tabBtnDonantes')!.click();
    expect(page.querySelector('#tabContentDonantes')!.classList.contains('hidden')).toBe(false);
  });

  it('conserva las partidas del presupuesto y las trata como texto', async () => {
    const fixture = TestBed.createComponent(Crear);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLInputElement>('#new-item-desc')!.value = '<b>Prueba</b>';
    page.querySelector<HTMLInputElement>('#new-item-qty')!.value = '2';
    page.querySelector<HTMLInputElement>('#new-item-price')!.value = '10';
    page.querySelector<HTMLButtonElement>('#confirm-add-row-btn')!.click();
    await fixture.whenStable();
    expect(page.querySelector('#total-display')!.textContent).toContain('2,910.00');
    const row = page.querySelector<HTMLElement>('.expense-row:last-child')!;
    expect(row.textContent).toContain('<b>Prueba</b>');
    expect(row.querySelector('b')).toBeNull();
    expect(TestBed.inject(DemoStore).draft().budget.at(-1)?.description).toBe('<b>Prueba</b>');
    row.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(page.querySelector('#total-display')!.textContent).toContain('2,890.00');
  });

  it('registra una donación simulada para la campaña seleccionada', () => {
    const store = TestBed.inject(DemoStore);
    expect(store.addDonation({ campaignId: 'luciana', amount: 40, tip: 2, method: 'Tarjeta', message: 'Ánimo', anonymous: true })).toBe(true);
    expect(store.campaign('luciana')!.raised).toBe(19440);
    expect(store.donations()[0]).toMatchObject({ amount: 40, tip: 2, anonymous: true });
    expect(JSON.parse(localStorage.getItem('voces-manos-demo-v1')!).donations).toHaveLength(1);
  });

  it('muestra la advertencia y permite seleccionar un método sin recopilar datos bancarios', async () => {
    const fixture = TestBed.createComponent(Checkout);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const card = page.querySelector<HTMLInputElement>('input[type=radio][value=Tarjeta]')!;
    card.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.method).toBe('Tarjeta');
    expect(page.textContent).toContain('No transfieras dinero');
    expect(page.querySelector('input[type=password]')).toBeNull();
  });

  it('guarda el método y el mensaje elegidos en la donación simulada', async () => {
    const fixture = TestBed.createComponent(Checkout);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLInputElement>('input[type=radio][value=Tarjeta]')!.click();
    page.querySelector<HTMLInputElement>('input[name=anonymous]')!.click();
    const message = page.querySelector<HTMLTextAreaElement>('#support-message')!;
    message.value = 'Mucho ánimo';
    message.dispatchEvent(new Event('input'));
    page.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(DemoStore).donations()[0]).toMatchObject({
      campaignId: 'anta', amount: 100, tip: 5, method: 'Tarjeta', message: 'Mucho ánimo', anonymous: true,
    });
    expect(navigate).toHaveBeenCalled();
  });

  it('explica un monto inválido y bloquea la confirmación', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/donar?campana=anta&monto=invalido&propina=5');
    expect(harness.routeNativeElement?.textContent).toContain('El monto o el aporte voluntario no es válido');
    expect(harness.routeNativeElement?.textContent).not.toContain('NaN');
    expect(harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(true);
  });

  it('limita el desembolso al saldo de la campaña y mantiene sus novedades separadas', () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    try {
      const store = TestBed.inject(DemoStore);
      store.addDonation({ campaignId: 'luciana', amount: 50, tip: 0, method: 'Tarjeta', message: '', anonymous: true });
      store.addPost('luciana', 'Avance de Luciana', null);
      const panel = TestBed.createComponent(Panel).componentInstance;
      panel.selectedCampaignId.set('luciana');
      panel.submitWithdrawal('50.001');
      panel.submitWithdrawal('51');
      expect(store.withdrawals()).toHaveLength(0);
      panel.submitWithdrawal('20');
      expect(panel.available).toBe(30);
      expect(panel.selectedPosts.map((post) => post.message)).toEqual(['Avance de Luciana']);
      panel.selectedCampaignId.set('anta');
      expect(panel.available).toBe(0);
      expect(panel.selectedPosts).toHaveLength(0);
    } finally {
      alert.mockRestore();
    }
  });

  it('asigna registros antiguos sin campaña a Anta al cargar los datos', () => {
    const store = TestBed.inject(DemoStore);
    store.addPost('anta', 'Registro anterior', null);
    store.addWithdrawal('anta', 10);
    const data = JSON.parse(localStorage.getItem('voces-manos-demo-v1')!);
    delete data.posts[0].campaignId;
    data.withdrawals = [10];
    localStorage.setItem('voces-manos-demo-v1', JSON.stringify(data));
    TestBed.resetTestingModule();
    const migrated = TestBed.inject(DemoStore);
    expect(migrated.posts()[0].campaignId).toBe('anta');
    expect(migrated.withdrawals()).toEqual([{ campaignId: 'anta', amount: 10 }]);
  });
});
