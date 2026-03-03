export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  type: "entree" | "sortie";
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  reason: string;
  reference?: string;
  operator: string;
  date: Date;
  notes?: string;
}

export interface BonReception {
  id: string;
  number: string;
  supplier: string;
  date: Date;
  status: "brouillon" | "valide" | "annule";
  items: BonReceptionItem[];
  totalItems: number;
  operator: string;
  notes?: string;
  createdAt: Date;
}

export interface BonReceptionItem {
  productId: string;
  productName: string;
  productCode: string;
  quantityOrdered: number;
  quantityReceived: number;
  unit: string;
}

export interface BonSortie {
  id: string;
  number: string;
  destination: string;
  requestedBy: string;
  date: Date;
  status: "brouillon" | "valide" | "annule";
  items: BonSortieItem[];
  totalItems: number;
  operator: string;
  notes?: string;
  createdAt: Date;
}

export interface BonSortieItem {
  productId: string;
  productName: string;
  productCode: string;
  quantityRequested: number;
  quantityDelivered: number;
  unit: string;
}

export interface Inventory {
  id: string;
  type: "annuel" | "intermediaire";
  name: string;
  startDate: Date;
  endDate?: Date;
  status: "en_cours" | "termine" | "valide";
  items: InventoryItem[];
  operator: string;
  notes?: string;
  createdAt: Date;
}

export interface InventoryItem {
  productId: string;
  productName: string;
  productCode: string;
  theoreticalStock: number;
  physicalStock: number;
  difference: number;
  unit: string;
  notes?: string;
}

export type NavPage = "dashboard" | "mouvements" | "reception" | "sortie" | "inventaire" | "produits" | "admin";

export type PagePermission = "dashboard" | "mouvements" | "reception" | "sortie" | "inventaire" | "produits";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  permissions: PagePermission[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "user";
  permissions: PagePermission[];
}
