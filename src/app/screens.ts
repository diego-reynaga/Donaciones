import { Component, ElementRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DemoStore, isValidAmount } from './demo-store';
import { downloadBlob, downloadDemoFile } from './demo-download';
import { formatDemoPost } from './demo-format';

@Component({ selector: 'app-panel', templateUrl: './panel.html' })
export class Panel {
  readonly store = inject(DemoStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  mode: 'beneficiaria' | 'donante' = 'beneficiaria';
  withdrawalOpen = false;
  readonly selectedCampaignId = signal('anta');
  readonly receiptFile = signal<{ name: string; data: string } | null>(null);
  readonly postFile = signal<{ name: string; data: string } | null>(null);
  readonly formatPostText = formatDemoPost;

  get selectedExpenses() {
    return this.store.expenses().filter((item) => item.campaignId === this.selectedCampaignId());
  }

  get selectedPosts() {
    return this.store.posts().filter((item) => item.campaignId === this.selectedCampaignId());
  }

  get expenseTotal(): number {
    return this.selectedExpenses.reduce((sum, item) => sum + item.amount, 0);
  }

  get donationCount(): number {
    return this.store.donations().filter((item) => item.campaignId === this.selectedCampaignId()).length;
  }

  get campaignProgress(): number {
    const campaign = this.store.campaign(this.selectedCampaignId());
    return campaign ? Math.min(100, Math.round(campaign.raised / campaign.goal * 100)) : 0;
  }

  get available(): number {
    const id = this.selectedCampaignId();
    const donated = this.store.donations().filter((item) => item.campaignId === id).reduce((sum, item) => sum + item.amount, 0);
    const withdrawn = this.store.withdrawals().filter((item) => item.campaignId === id).reduce((sum, item) => sum + item.amount, 0);
    return Math.round((donated - withdrawn) * 100) / 100;
  }

  selectCampaign(event: Event): void {
    this.selectedCampaignId.set((event.target as HTMLSelectElement).value);
  }

  setMode(mode: 'beneficiaria' | 'donante'): void {
    this.mode = mode;
    setTimeout(() => this.host.querySelector('#actividad-local')?.scrollIntoView({ behavior: 'smooth' }));
  }

  requestWithdrawal(): void {
    if (this.available <= 0) {
      window.alert('No hay saldo simulado disponible para solicitar.');
      return;
    }
    this.withdrawalOpen = true;
  }

  submitWithdrawal(input: string): void {
    const amount = Number(input);
    if (!isValidAmount(amount) || amount > this.available) {
      window.alert('Ingresa un monto válido que no supere el saldo simulado.');
      return;
    }
    if (this.store.addWithdrawal(this.selectedCampaignId(), amount)) {
      this.withdrawalOpen = false;
      window.alert('Solicitud simulada guardada localmente. No se realizará un desembolso.');
    }
  }

  selectFile(event: Event, destination: 'receipt' | 'post'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const types = destination === 'receipt' ? ['image/jpeg', 'image/png', 'application/pdf'] : ['image/jpeg', 'image/png'];
    if (file.size > 1024 * 1024 || !types.includes(file.type)) {
      window.alert('Selecciona un archivo permitido de hasta 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => window.alert('No se pudo leer el archivo seleccionado.');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        window.alert('No se pudo leer el archivo seleccionado.');
        return;
      }
      if (destination === 'receipt') this.receiptFile.set({ name: file.name, data: reader.result });
      else this.postFile.set({ name: file.name, data: reader.result });
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  submitExpense(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim();
    const file = this.receiptFile();
    if (!isValidAmount(amount) || !category || !description || !file) {
      window.alert('Selecciona un archivo e ingresa monto, rubro y descripción.');
      return;
    }
    if (this.store.addExpense({ campaignId: this.selectedCampaignId(), amount, category, description, fileName: file.name, fileData: file.data })) {
      form.reset();
      this.receiptFile.set(null);
      window.alert('Comprobante de demostración guardado en este navegador; no se ha enviado a auditoría.');
    }
  }

  formatPost(mark: 'bold' | 'italic' | 'list'): void {
    const editor = this.host.querySelector<HTMLTextAreaElement>('#post-editor')!;
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    const replacement = mark === 'list' ? `- ${selected || 'Elemento'}` : `${mark === 'bold' ? '**' : '*'}${selected || 'texto'}${mark === 'bold' ? '**' : '*'}`;
    editor.setRangeText(replacement, editor.selectionStart, editor.selectionEnd, 'select');
    editor.focus();
  }

  publishPost(): void {
    const editor = this.host.querySelector<HTMLTextAreaElement>('#post-editor')!;
    const message = editor.value.trim();
    if (!message) {
      window.alert('Escribe una actualización antes de guardarla.');
      return;
    }
    if (this.store.addPost(this.selectedCampaignId(), message, this.postFile())) {
      editor.value = '';
      this.postFile.set(null);
      window.alert('Actualización guardada localmente. No se ha enviado ningún mensaje real.');
    }
  }

  thank(id: string): void {
    if (this.store.addThanks(id)) window.alert('Agradecimiento simulado guardado en este navegador.');
  }

  downloadDirectory(): void {
    const rows = this.store.donations().filter((item) => item.campaignId === this.selectedCampaignId()).map((item) => [item.date, item.anonymous ? 'Anónimo' : 'Donante de demostración', item.amount.toFixed(2), this.store.campaign(item.campaignId)?.title ?? '']);
    const csv = [['Fecha', 'Donante', 'Monto simulado', 'Campaña'], ...rows].map((row) =>
      row.map((value) => `"${String(value).replace(/^[=+\-@]/, "'$&").replaceAll('"', '""')}"`).join(',')).join('\r\n');
    downloadBlob('donaciones-demostracion.csv', new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  }

  downloadData(name: string, data: string): void {
    downloadDemoFile(name, data);
  }
}

@Component({ selector: 'app-historia', templateUrl: './historia.html' })
export class Historia {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly router = inject(Router);
  readonly store = inject(DemoStore);
  readonly formatPostText = formatDemoPost;
  zoom = false;
  private amount = 100;
  private tip = 5;

  downloadData(name: string, data: string): void {
    downloadDemoFile(name, data);
  }

  get progress(): number {
    const campaign = this.store.campaign('anta');
    return campaign ? Math.min(100, Math.round(campaign.raised / campaign.goal * 100)) : 0;
  }

  private updateTotal(): void {
    const total = `S/ ${(this.amount * (1 + this.tip / 100)).toFixed(2)}`;
    const display = this.host.querySelector<HTMLElement>('#displayTotalPledge');
    const button = this.host.querySelector<HTMLElement>('#donateSubmitBtn span:last-child');
    if (display) display.textContent = total;
    if (button) button.textContent = `Donar ${total} Ahora`;
  }

  selectPledge(amount: number, event: Event): void {
    this.amount = amount;
    const input = this.host.querySelector<HTMLInputElement>('#customPledgeInput');
    if (input) input.value = '';
    this.highlightPledge(event.currentTarget as HTMLElement);
    this.updateTotal();
  }

  onCustomAmountChange(event: Event): void {
    const amount = Number((event.target as HTMLInputElement).value);
    if (amount > 0) {
      this.amount = amount;
      this.highlightPledge();
      this.updateTotal();
    }
  }

  private highlightPledge(selected?: HTMLElement): void {
    this.host.querySelectorAll<HTMLElement>('.pledge-chip').forEach((button) => {
      button.classList.remove('ring-2', 'ring-primary', 'bg-primary-fixed/40', 'text-on-primary-fixed-variant');
      button.classList.add('bg-surface-container-low', 'text-on-surface');
    });
    if (selected) {
      selected.classList.remove('bg-surface-container-low', 'text-on-surface');
      selected.classList.add('ring-2', 'ring-primary', 'bg-primary-fixed/40', 'text-on-primary-fixed-variant');
    }
  }

  selectTip(percent: number, event: Event): void {
    this.tip = percent;
    this.host.querySelectorAll<HTMLElement>('.tip-btn').forEach((button) => {
      button.classList.remove('bg-secondary', 'text-on-secondary');
      button.classList.add('bg-surface-container', 'text-on-surface-variant');
    });
    const selected = event.currentTarget as HTMLElement;
    selected.classList.remove('bg-surface-container', 'text-on-surface-variant');
    selected.classList.add('bg-secondary', 'text-on-secondary');
    this.updateTotal();
  }

  switchStoryTab(tab: 'bitacora' | 'donantes'): void {
    for (const [name, suffix] of [['bitacora', 'Bitacora'], ['donantes', 'Donantes']] as const) {
      const active = name === tab;
      this.host.querySelector(`#tabContent${suffix}`)?.classList.toggle('hidden', !active);
      const button = this.host.querySelector(`#tabBtn${suffix}`);
      button?.classList.toggle('text-primary', active);
      button?.classList.toggle('border-b-2', active);
      button?.classList.toggle('border-primary', active);
      button?.classList.toggle('text-on-surface-variant', !active);
    }
  }

  goToCheckout(): void {
    const input = this.host.querySelector<HTMLInputElement>('#customPledgeInput');
    if ((input?.value && !isValidAmount(Number(input.value))) || !isValidAmount(this.amount)) {
      window.alert('Ingresa un monto mayor que cero, con hasta dos decimales.');
      return;
    }
    void this.router.navigate(['/donar'], { queryParams: { campana: 'anta', monto: this.amount, propina: this.tip } });
  }
}

@Component({ selector: 'app-checkout', standalone: true, imports: [FormsModule], templateUrl: './checkout.html', styleUrl: './checkout.css' })
export class Checkout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(DemoStore);
  readonly campaignId = this.route.snapshot.queryParamMap.get('campana') ?? 'anta';
  readonly campaign = this.store.campaign(this.campaignId);
  readonly amount = Number(this.route.snapshot.queryParamMap.get('monto') ?? 100);
  readonly tipPercent = Number(this.route.snapshot.queryParamMap.get('propina') ?? 5);
  method = 'Yape / Plin';
  message = '';
  anonymous = false;
  submitted = false;

  get valid(): boolean {
    return !!this.campaign && isValidAmount(this.amount) &&
      Number.isFinite(this.tipPercent) && this.tipPercent >= 0 && this.tipPercent <= 100;
  }

  get tip(): number {
    return Math.round(this.amount * this.tipPercent) / 100;
  }

  format(amount: number): string {
    return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  changeAmount(): void {
    void this.router.navigateByUrl(this.campaignId === 'anta' ? '/historia' : `/historia/${this.campaignId}`);
  }

  confirm(): void {
    if (this.submitted) return;
    if (!this.valid || !this.campaign) {
      window.alert('Selecciona una campaña y un monto válido para continuar.');
      return;
    }
    this.submitted = true;
    if (this.store.addDonation({
      campaignId: this.campaign.id, amount: this.amount, tip: this.tip, method: this.method,
      message: this.message.trim(), anonymous: this.anonymous,
    })) {
      const donation = this.store.donations()[0];
      void this.router.navigate(['/comprobante', donation.id]);
    } else this.submitted = false;
  }
}

@Component({ selector: 'app-crear', templateUrl: './crear.html' })
export class Crear {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly store = inject(DemoStore);

  openBudgetPanel(): void {
    this.host.querySelector('#add-row-panel')?.classList.remove('hidden');
    this.host.querySelector<HTMLInputElement>('#new-item-desc')?.focus();
  }

  closeBudgetPanel(): void {
    this.host.querySelector('#add-row-panel')?.classList.add('hidden');
    this.input('new-item-desc').value = '';
    this.input('new-item-qty').value = '1';
    this.input('new-item-price').value = '';
  }

  addBudgetRow(): void {
    const description = this.input('new-item-desc').value.trim();
    const quantity = Number(this.input('new-item-qty').value);
    const price = Number(this.input('new-item-price').value);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) {
      window.alert('Ingresa una descripción, una cantidad válida y un costo válido.');
      return;
    }
    const category = this.host.querySelector<HTMLSelectElement>('#new-item-category')!.value;
    const draft = this.store.draft();
    const budget = [...draft.budget, { id: crypto.randomUUID(), category, description, detail: 'Agregado por proponente', quantity, unit: 'un.', price }];
    if (this.store.saveDraft({ ...draft, budget, goal: this.budgetTotal(budget) })) this.closeBudgetPanel();
  }

  removeBudgetRow(id: string): void {
    const draft = this.store.draft();
    const budget = draft.budget.filter((item) => item.id !== id);
    this.store.saveDraft({ ...draft, budget, goal: this.budgetTotal(budget) });
  }

  selectProof(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 || !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      window.alert('Selecciona un archivo JPG, PNG o PDF de hasta 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => window.alert('No se pudo leer el archivo seleccionado.');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        window.alert('No se pudo leer el archivo seleccionado.');
        return;
      }
      this.store.saveDraft({ ...this.store.draft(), proof: { name: file.name, data: reader.result } });
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeProof(): void {
    this.store.saveDraft({ ...this.store.draft(), proof: null });
  }

  private input(id: string): HTMLInputElement {
    return this.host.querySelector<HTMLInputElement>(`#${id}`)!;
  }

  private budgetTotal(items: { quantity: number; price: number }[]): number {
    return Math.round(items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100) / 100;
  }

  formatMoney(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
