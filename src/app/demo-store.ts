import { Injectable, computed, signal } from '@angular/core';

export interface DemoCampaign {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  goal: number;
  raised: number;
  budget?: BudgetItem[];
  proof?: { name: string; data: string } | null;
  photo?: { name: string; data: string } | null;
}

export interface DemoDonation {
  id: string;
  campaignId: string;
  amount: number;
  tip: number;
  method: string;
  message: string;
  anonymous: boolean;
  date: string;
}

export interface DemoExpense {
  id: string;
  campaignId: string;
  amount: number;
  category: string;
  description: string;
  fileName: string;
  fileData: string;
  date: string;
}

export interface DemoPost {
  id: string;
  campaignId: string;
  message: string;
  date: string;
  attachment: { name: string; data: string } | null;
}

export interface DemoDraft {
  title: string;
  description: string;
  category: string;
  location: string;
  owner: string;
  goal: number;
  budget: BudgetItem[];
  proof: { name: string; data: string } | null;
  photo: { name: string; data: string } | null;
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  detail: string;
  quantity: number;
  unit: string;
  price: number;
}

interface DemoData {
  campaigns: DemoCampaign[];
  donations: DemoDonation[];
  expenses: DemoExpense[];
  posts: DemoPost[];
  withdrawals: { campaignId: string; amount: number }[];
  thanks: string[];
  contacts: { id: string; message: string; date: string }[];
  draft: DemoDraft;
}

const initialData: DemoData = {
  campaigns: [
    { id: 'anta', title: 'Reconstrucción del taller de telar y sustento para 18 madres tejedoras de Anta', description: 'Una comunidad de tejedoras busca recuperar su espacio de trabajo tras las lluvias.', category: 'Vivienda y Reconstrucción', location: 'Anta, Cusco', goal: 18000, raised: 14850 },
    { id: 'luciana', title: 'Tratamiento oncológico y hospedaje para la pequeña Luciana (6 años)', description: 'Apoyo para traslados, hospedaje y tratamiento.', category: 'Salud Crítica', location: 'Huancayo', goal: 24000, raised: 19400 },
    { id: 'comedor', title: "Comedor Popular 'Santa Rosa': Compra de ollas industriales y víveres para 120 familias", description: 'Renovación de equipamiento y provisión de alimentos.', category: 'Alimentación', location: 'Lima', goal: 6500, raised: 5850 },
    { id: 'paucartambo', title: 'Becas de transporte y útiles para niños de la escuela rural de Paucartambo', description: 'Transporte y útiles escolares para estudiantes rurales.', category: 'Educación Comunitaria', location: 'Paucartambo, Cusco', goal: 8200, raised: 3100 },
    { id: 'ayacucho', title: 'Reconstrucción de acequia comunal para regadío de quinua nativa', description: 'Materiales para recuperar un canal comunal.', category: 'Emergencias Climáticas', location: 'Huanta, Ayacucho', goal: 12000, raised: 11200 },
  ],
  donations: [],
  expenses: [],
  posts: [],
  withdrawals: [],
  thanks: [],
  contacts: [],
  draft: {
    title: '', description: '', category: 'Vivienda y Reconstrucción', location: '', owner: '', goal: 2890, proof: null, photo: null,
    budget: [
      { id: '1', category: 'Materiales', description: 'Calaminas y clavos de fijación', detail: 'Calibre 28 galvanizado anticorrosión', quantity: 24, unit: 'un.', price: 35 },
      { id: '2', category: 'Equipamiento', description: 'Bastidor de madera reforzada', detail: 'Estructura para telar comunal de 2x1.5m', quantity: 2, unit: 'un.', price: 450 },
      { id: '3', category: 'Materia Prima', description: 'Hilados de lana de oveja teñida natural', detail: 'Pigmentos andinos tradicionales (cochinilla/nogal)', quantity: 15, unit: 'kg', price: 60 },
      { id: '4', category: 'Logística', description: 'Flete y traslado a comunidad campesina', detail: 'Ruta Calca - Paru Paru (trocha carrozable)', quantity: 1, unit: 'viaje', price: 250 },
    ],
  },
};

const STORAGE_KEY = 'voces-manos-demo-v1';

export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 1_000_000_000 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

@Injectable({ providedIn: 'root' })
export class DemoStore {
  private readonly data = signal<DemoData>(this.load());
  readonly campaigns = computed(() => this.data().campaigns);
  readonly donations = computed(() => this.data().donations);
  readonly expenses = computed(() => this.data().expenses);
  readonly posts = computed(() => this.data().posts);
  readonly withdrawals = computed(() => this.data().withdrawals);
  readonly thanks = computed(() => this.data().thanks);
  readonly contacts = computed(() => this.data().contacts);
  readonly draft = computed(() => this.data().draft);

  campaign(id: string): DemoCampaign | undefined {
    return this.campaigns().find((campaign) => campaign.id === id);
  }

  saveDraft(draft: DemoDraft): boolean {
    return this.save({ ...this.data(), draft });
  }

  publishCampaign(): boolean {
    const draft = this.draft();
    const campaign: DemoCampaign = {
      id: crypto.randomUUID(), title: draft.title, description: draft.description,
      category: draft.category, location: draft.location, goal: draft.goal, raised: 0,
      budget: draft.budget, proof: draft.proof, photo: draft.photo,
    };
    return this.save({
      ...this.data(),
      campaigns: [...this.campaigns(), campaign],
      draft: structuredClone(initialData.draft),
    });
  }

  addDonation(donation: Omit<DemoDonation, 'id' | 'date'>): boolean {
    const campaign = this.campaign(donation.campaignId);
    if (!campaign || !isValidAmount(donation.amount) ||
        !Number.isFinite(donation.tip) || donation.tip < 0) {
      window.alert('No se pudo registrar la donación simulada: verifica la campaña y el monto.');
      return false;
    }
    return this.save({
      ...this.data(),
      campaigns: this.campaigns().map((item) => item.id === campaign.id
        ? { ...item, raised: item.raised + donation.amount } : item),
      donations: [{ ...donation, id: crypto.randomUUID(), date: new Date().toISOString() }, ...this.donations()],
    });
  }

  addExpense(expense: Omit<DemoExpense, 'id' | 'date'>): boolean {
    return this.save({ ...this.data(), expenses: [{ ...expense, id: crypto.randomUUID(), date: new Date().toISOString() }, ...this.expenses()] });
  }

  addPost(campaignId: string, message: string, attachment: DemoPost['attachment']): boolean {
    return this.save({ ...this.data(), posts: [{ id: crypto.randomUUID(), campaignId, message, attachment, date: new Date().toISOString() }, ...this.posts()] });
  }

  addWithdrawal(campaignId: string, amount: number): boolean {
    return this.save({ ...this.data(), withdrawals: [...this.withdrawals(), { campaignId, amount }] });
  }

  addThanks(id: string): boolean {
    return this.save({ ...this.data(), thanks: [...new Set([...this.thanks(), id])] });
  }

  addContact(message: string): boolean {
    return this.save({ ...this.data(), contacts: [{ id: crypto.randomUUID(), message, date: new Date().toISOString() }, ...this.contacts()] });
  }

  private load(): DemoData {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(initialData);
    try {
      const data: DemoData = JSON.parse(saved);
      if (data.contacts === undefined) data.contacts = [];
      if (!Array.isArray(data.campaigns) || !Array.isArray(data.donations) || !Array.isArray(data.expenses) ||
          !Array.isArray(data.posts) || !Array.isArray(data.withdrawals) || !Array.isArray(data.thanks) ||
          !Array.isArray(data.contacts) || !data.draft || !Array.isArray(data.draft.budget)) {
        throw new Error('Invalid demo data');
      }
      data.expenses = data.expenses.map((item) => ({ ...item, campaignId: item.campaignId || 'anta' }));
      data.posts = data.posts.map((item) => ({ ...item, campaignId: item.campaignId || 'anta' }));
      data.withdrawals = data.withdrawals.map((item) => typeof item === 'number' ? { campaignId: 'anta', amount: item } : item);
      return data;
    } catch (error) {
      console.error('No se pudieron leer los datos de demostración.', error);
      window.alert('Los datos de demostración guardados no se pueden leer. No se modificarán.');
      throw error;
    }
  }

  private save(data: DemoData): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('No se pudieron guardar los datos de demostración.', error);
      window.alert('No se pudieron guardar los datos en este navegador. Comprueba el espacio disponible.');
      return false;
    }
    this.data.set(data);
    return true;
  }
}
