import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DemoStore, isValidAmount } from './demo-store';
import { downloadDemoFile } from './demo-download';
import { formatDemoPost } from './demo-format';

@Component({
  selector: 'app-campaign-detail',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-surface px-6 py-10 text-on-surface">
      <div class="mx-auto max-w-[1080px]">
        <a routerLink="/" class="font-ui-interactive text-primary">← Explorar Historias</a>
        @if (campaign; as story) {
          <div class="mt-8 grid gap-8 lg:grid-cols-3">
            <section class="lg:col-span-2 rounded-xl bg-surface-container-lowest p-8 shadow-sm">
              <span class="font-label-caps text-label-caps text-secondary uppercase">{{ story.category }} · {{ story.location }}</span>
              <h1 class="mt-4 font-headline-lg text-headline-lg">{{ story.title }}</h1>
              @if (story.photo; as photo) { <img class="mt-5 max-h-96 w-full rounded-lg object-cover" [src]="photo.data" [alt]="story.title"> }
              <p class="mt-5 font-body-lg text-body-lg">{{ story.description }}</p>
              @if (story.budget?.length) {
                <h2 class="mt-10 font-headline-sm text-headline-sm">Presupuesto de demostración</h2>
                @for (item of story.budget; track item.id) {
                  <p class="mt-3 rounded-lg bg-surface-container-low p-4">{{ item.description }} · S/ {{ format(item.quantity * item.price) }}</p>
                }
              }
              @if (story.proof; as proof) {
                <button type="button" class="mt-4 text-primary underline" (click)="downloadProof(proof.name, proof.data)">Descargar {{ proof.name }}</button>
              }
              <h2 class="mt-10 font-headline-sm text-headline-sm">Bitácora de demostración</h2>
              @for (post of store.posts(); track post.id) {
                @if (post.campaignId === story.id) {
                  <div class="mt-3 rounded-lg bg-surface-container-low p-4"><p [innerHTML]="formatPostText(post.message)"></p>
                    @if (post.attachment; as file) { <button type="button" class="text-primary underline" (click)="downloadProof(file.name, file.data)">Descargar {{ file.name }}</button> }
                  </div>
                }
              }
              <h2 class="mt-10 font-headline-sm text-headline-sm">Mensajes solidarios de demostración</h2>
              @for (donation of store.donations(); track donation.id) {
                @if (donation.campaignId === story.id) {
                  <p class="mt-3 rounded-lg bg-surface-container-low p-4">{{ donation.anonymous ? 'Donante anónimo' : 'Donante de demostración' }} · S/ {{ format(donation.amount) }}<br>{{ donation.message }}</p>
                }
              }
            </section>
            <aside class="rounded-xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
              <p class="font-ui-interactive">S/ {{ format(story.raised) }} de S/ {{ format(story.goal) }}</p>
              <label class="block font-ui-interactive" for="amount">Monto del aporte simulado</label>
              <input id="amount" type="number" min="0.01" step="0.01" [(ngModel)]="amount" class="w-full rounded-lg bg-surface-container-low p-3">
              <label class="block font-ui-interactive" for="tip">Aporte voluntario (%)</label>
              <select id="tip" [(ngModel)]="tip" class="w-full rounded-lg bg-surface-container-low p-3"><option [ngValue]="0">0%</option><option [ngValue]="5">5%</option><option [ngValue]="10">10%</option></select>
              <button type="button" class="w-full rounded-lg bg-primary px-6 py-3 font-ui-interactive text-on-primary" (click)="donate()">Continuar a donación simulada</button>
            </aside>
          </div>
        } @else {
          <h1 class="mt-8 font-headline-md text-headline-md">No se encontró la campaña.</h1>
        }
      </div>
    </main>
  `,
})
export class CampaignDetail {
  readonly store = inject(DemoStore);
  readonly formatPostText = formatDemoPost;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly campaign = this.store.campaign(this.route.snapshot.paramMap.get('id') ?? '');
  amount = 100;
  tip = 5;

  format(amount: number): string {
    return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  downloadProof(name: string, data: string): void {
    downloadDemoFile(name, data);
  }

  donate(): void {
    if (!this.campaign || !isValidAmount(this.amount)) {
      window.alert('Ingresa un monto mayor que cero, con hasta dos decimales.');
      return;
    }
    void this.router.navigate(['/donar'], { queryParams: { campana: this.campaign.id, monto: this.amount, propina: this.tip } });
  }
}

@Component({
  selector: 'app-demo-receipt',
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-surface px-6 py-12">
      <div class="mx-auto max-w-2xl rounded-xl bg-surface-container-lowest p-8 shadow-sm">
        @if (donation; as item) {
          <p class="font-label-caps text-label-caps text-secondary uppercase">Demostración · Sin pago real</p>
          <h1 class="mt-3 font-headline-lg text-headline-lg">Donación simulada registrada</h1>
          <p class="mt-4">Tu aporte de S/ {{ format(item.amount) }} para {{ campaign?.title }} se guardó en este navegador.</p>
          <p class="mt-2">Método simulado: {{ item.method }}. Aporte voluntario: S/ {{ format(item.tip) }}.</p>
          <p class="mt-2 text-on-surface-variant">Este registro no es un comprobante oficial y no acredita una transferencia.</p>
          <button type="button" class="mt-6 rounded-lg bg-primary px-5 py-3 font-ui-interactive text-on-primary" (click)="print()">Imprimir registro</button>
        } @else {
          <h1 class="font-headline-md text-headline-md">No se encontró el registro.</h1>
        }
        <div class="mt-6 flex gap-6"><a routerLink="/" class="text-primary underline">Explorar historias</a><a routerLink="/mi-panel" class="text-primary underline">Ir a mi panel</a></div>
      </div>
    </main>
  `,
})
export class DemoReceipt {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DemoStore);
  readonly donation = this.store.donations().find((item) => item.id === this.route.snapshot.paramMap.get('id'));
  readonly campaign = this.donation ? this.store.campaign(this.donation.campaignId) : undefined;
  format(amount: number): string { return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  print(): void { window.print(); }
}

@Component({
  selector: 'app-campaign-wizard',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-surface px-6 py-10 text-on-surface">
      <div class="mx-auto max-w-3xl">
        <a routerLink="/" class="text-primary font-ui-interactive">← Explorar Historias</a>
        <p class="mt-8 font-label-caps text-label-caps text-primary uppercase">Postulación de demostración · Paso {{ step }} de 4</p>
        <h1 class="mt-3 font-headline-lg text-headline-lg">Registro de iniciativa comunal</h1>
        <div class="mt-6 rounded-xl bg-surface-container-lowest p-8 shadow-sm space-y-5">
          @if (step === 1) {
            <h2 class="font-headline-md text-headline-md">Datos del responsable</h2>
            <p>Esta demostración no verifica identidad. No ingreses DNI, contraseñas ni datos personales sensibles.</p>
            <label for="owner" class="block font-ui-interactive">Nombre de muestra</label>
            <input id="owner" [(ngModel)]="draft.owner" maxlength="100" class="w-full rounded-lg bg-surface-container-low p-3" placeholder="Nombre para la demostración">
          } @else if (step === 2) {
            <h2 class="font-headline-md text-headline-md">Historia y ubicación</h2>
            <label for="title" class="block font-ui-interactive">Título</label><input id="title" [(ngModel)]="draft.title" maxlength="150" class="w-full rounded-lg bg-surface-container-low p-3">
            <label for="description" class="block font-ui-interactive">Descripción</label><textarea id="description" [(ngModel)]="draft.description" maxlength="1000" rows="4" class="w-full rounded-lg bg-surface-container-low p-3"></textarea>
            <label for="location" class="block font-ui-interactive">Ubicación</label><input id="location" [(ngModel)]="draft.location" maxlength="100" class="w-full rounded-lg bg-surface-container-low p-3">
            <label for="category" class="block font-ui-interactive">Categoría</label>
            <select id="category" [(ngModel)]="draft.category" class="w-full rounded-lg bg-surface-container-low p-3">
              <option>Vivienda y Reconstrucción</option><option>Salud Crítica</option><option>Educación Comunitaria</option><option>Emergencias Climáticas</option>
            </select>
            <label for="photo" class="block font-ui-interactive">Fotografía de muestra (opcional, JPG o PNG hasta 1 MB)</label>
            <input id="photo" type="file" accept="image/jpeg,image/png" (change)="selectPhoto($event)">
            @if (draft.photo; as photo) {
              <p>{{ photo.name }} <button type="button" class="text-primary underline" (click)="draft.photo = null">Quitar</button></p>
            }
          } @else {
            <h2 class="font-headline-md text-headline-md">Revisión y publicación simulada</h2>
            <p><strong>Iniciativa:</strong> {{ draft.title || 'Sin título' }}</p>
            <p><strong>Ubicación:</strong> {{ draft.location || 'Sin ubicación' }}</p>
            <p><strong>Meta:</strong> S/ {{ draft.goal.toFixed(2) }}</p>
            <p>La publicación será local y no se validará ninguna cuenta bancaria. No ingreses datos bancarios en esta demostración.</p>
          }
          <div class="flex flex-wrap justify-between gap-4 pt-4">
            <button type="button" class="px-5 py-3 font-ui-interactive text-primary" (click)="back()">Volver</button>
            <button type="button" class="rounded-lg bg-primary px-6 py-3 font-ui-interactive text-on-primary" (click)="next()">{{ step === 4 ? 'Publicar simulación' : 'Continuar' }}</button>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class CampaignWizard {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(DemoStore);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly step = this.route.snapshot.paramMap.get('step') === 'paso-2' ? 2 : this.route.snapshot.paramMap.get('step') === 'paso-4' ? 4 : 1;
  draft = structuredClone(this.store.draft());

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
      window.alert('Selecciona una imagen JPG o PNG de hasta 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => window.alert('No se pudo leer la imagen seleccionada.');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        window.alert('No se pudo leer la imagen seleccionada.');
        return;
      }
      this.draft.photo = { name: file.name, data: reader.result };
      input.value = '';
      this.changeDetector.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  back(): void {
    if (!this.store.saveDraft(this.draft)) return;
    void this.router.navigateByUrl(this.step === 1 ? '/' : this.step === 2 ? '/crear-campana' : '/presupuesto');
  }


  next(): void {
    if (this.step === 1 && !this.draft.owner.trim()) {
      window.alert('Ingresa un nombre de muestra.');
      return;
    }
    if (this.step === 2 && (!this.draft.title.trim() || !this.draft.description.trim() || !this.draft.location.trim())) {
      window.alert('Completa el título, la descripción y la ubicación.');
      return;
    }
    if (!this.store.saveDraft(this.draft)) return;
    if (this.step === 4) {
      if (!this.draft.owner.trim() || !this.draft.title.trim() || !this.draft.description.trim() || !this.draft.location.trim() || this.draft.goal <= 0) {
        window.alert('Completa los datos de la iniciativa y un presupuesto mayor que cero antes de publicar.');
        return;
      }
      if (this.store.publishCampaign()) void this.router.navigateByUrl('/mi-panel');
    } else {
      void this.router.navigateByUrl(this.step === 1 ? '/crear-campana/paso-2' : '/presupuesto');
    }
  }
}

const information: Record<string, { title: string; text: string }> = {
  'criterios-de-verificacion-dni': { title: 'Verificación de identidad', text: 'Esta demostración no consulta RENIEC ni verifica identidades. No introduzcas documentos de identidad reales.' },
  'reportes-fiscales': { title: 'Reportes fiscales', text: 'Los datos de demostración no son comprobantes fiscales ni declaraciones tributarias.' },
  'protocolo-territorial': { title: 'Protocolo de veedores', text: 'La verificación territorial es parte del diseño de ejemplo; no se realiza ninguna verificación en esta demostración.' },
  'consejo-etico': { title: 'Consejo ético', text: 'El consejo mencionado en el diseño es ilustrativo; esta demostración no envía solicitudes a un consejo real.' },
  'alianzas-comunales': { title: 'Asociaciones de base', text: 'Las organizaciones mostradas son parte de los datos de ejemplo de esta demostración.' },
  'contacto-soporte': { title: 'Contacto y soporte', text: 'Puedes registrar una consulta de prueba en este navegador. No se enviará a ningún servicio de soporte.' },
  'terminos-de-servicio': { title: 'Términos de servicio', text: 'Esta es una demostración local, no un servicio de donaciones operativo. No se procesan transacciones ni se ofrecen términos contractuales.' },
  'privacidad-de-datos': { title: 'Privacidad y datos', text: 'Los datos que introduces se guardan localmente en este navegador. No introduzcas datos personales sensibles, documentos reales ni información bancaria.' },
};

@Component({
  selector: 'app-information',
  imports: [RouterLink, FormsModule],
  template: `
    <main class="min-h-screen bg-surface px-6 py-12">
      <div class="mx-auto max-w-3xl rounded-xl bg-surface-container-lowest p-8 shadow-sm">
        <a routerLink="/" class="font-ui-interactive text-primary">← Explorar Historias</a>
        <p class="mt-8 font-label-caps text-label-caps text-secondary uppercase">Información de demostración</p>
        <h1 class="mt-3 font-headline-lg text-headline-lg">{{ info?.title || 'Página no encontrada' }}</h1>
        <p class="mt-5 font-body-lg text-body-lg">{{ info?.text }}</p>
        @if (topic === 'contacto-soporte') {
          <label for="contact-message" class="mt-6 block font-ui-interactive">Consulta de demostración</label>
          <textarea id="contact-message" [(ngModel)]="message" maxlength="500" rows="4" class="mt-2 w-full rounded-lg bg-surface-container-low p-3" placeholder="No incluyas datos personales sensibles"></textarea>
          <button type="button" class="mt-3 rounded-lg bg-primary px-5 py-3 font-ui-interactive text-on-primary" (click)="saveContact()">Guardar consulta local</button>
          @for (contact of store.contacts(); track contact.id) { <p class="mt-3 rounded-lg bg-surface-container-low p-3">{{ contact.message }}</p> }
        }
        <a routerLink="/mi-panel" class="mt-6 inline-block text-primary underline">Consultar panel de demostración</a>
      </div>
    </main>
  `,
})
export class Information {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(DemoStore);
  readonly topic = this.route.snapshot.paramMap.get('topic') ?? '';
  readonly info = information[this.topic];
  message = '';

  saveContact(): void {
    const message = this.message.trim();
    if (!message) {
      window.alert('Escribe una consulta de demostración.');
      return;
    }
    if (this.store.addContact(message)) {
      this.message = '';
      window.alert('Consulta guardada localmente. No se ha enviado a un servicio de soporte.');
    }
  }
}

