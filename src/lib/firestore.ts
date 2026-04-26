"use client";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, StockMovement, BonReception, BonSortie, Inventory, Supplier, Operator } from "./types";

// ==================== PRODUCTS ====================
export const productsCollection = collection(db, "products");

const PAGE_SIZE = 10000;

export async function getProducts(lastDoc?: { name: string }): Promise<{ products: Product[]; lastDoc: { name: string } | null; hasMore: boolean }> {
  let q = query(productsCollection, orderBy("name"), limit(PAGE_SIZE));
  
  if (lastDoc) {
    q = query(productsCollection, orderBy("name"), startAfter(lastDoc.name), limit(PAGE_SIZE));
  }
  
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[];
  
  const lastDocument = snapshot.docs[snapshot.docs.length - 1];
  return {
    products,
    lastDoc: lastDocument ? { name: lastDocument.data().name as string } : null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function addProduct(product: Omit<Product, "id"> ): Promise<string> {
  const docRef = await addDoc(productsCollection, {
    ...product,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProduct(id: string, data: Partial<Product>, email?: string): Promise<void> {
  const docRef = doc(db, "products", id);
  await updateDoc(docRef, { 
    ...data, 
    updatedAt: Timestamp.now(),
    updatedByEmail: email,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

// ==================== STOCK MOVEMENTS ====================
export const movementsCollection = collection(db, "movements");

const MOVEMENTS_PAGE_SIZE = 10000;

export async function getMovements(lastDoc?: { date: Date }): Promise<{ movements: StockMovement[]; lastDoc: { date: Date } | null; hasMore: boolean }> {
  let q = query(movementsCollection, orderBy("date", "desc"), limit(MOVEMENTS_PAGE_SIZE));
  
  if (lastDoc) {
    const lastTimestamp = Timestamp.fromDate(lastDoc.date);
    q = query(movementsCollection, orderBy("date", "desc"), startAfter(lastTimestamp), limit(MOVEMENTS_PAGE_SIZE));
  }
  
  const snapshot = await getDocs(q);
  const movements = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
  })) as StockMovement[];
  
  const lastDocument = snapshot.docs[snapshot.docs.length - 1];
  return {
    movements,
    lastDoc: lastDocument ? { date: lastDocument.data().date?.toDate() as Date } : null,
    hasMore: snapshot.docs.length === MOVEMENTS_PAGE_SIZE,
  };
}

export async function addMovement(movement: Omit<StockMovement, "id">): Promise<string> {
  const docRef = await addDoc(movementsCollection, {
    ...movement,
    date: Timestamp.fromDate(movement.date),
    operatorEmail: movement.operatorEmail,
  });

  // Update product stock
  const productRef = doc(db, "products", movement.productId);
  const productSnap = await getDoc(productRef);
  if (productSnap.exists()) {
    const currentStock = productSnap.data().currentStock || 0;
    const newStock =
      movement.type === "entree"
        ? currentStock + movement.quantity
        : currentStock - movement.quantity;
    await updateDoc(productRef, {
      currentStock: Math.max(0, newStock),
      updatedAt: Timestamp.now(),
    });
  }

  return docRef.id;
}

// ==================== BON DE RECEPTION ====================
export const receptionsCollection = collection(db, "receptions");

const RECEPTIONS_PAGE_SIZE = 10000;

export async function getReceptions(lastDoc?: { date: Date }): Promise<{ receptions: BonReception[]; lastDoc: { date: Date } | null; hasMore: boolean }> {
  let q = query(receptionsCollection, orderBy("date", "desc"), limit(RECEPTIONS_PAGE_SIZE));
  
  if (lastDoc) {
    const lastTimestamp = Timestamp.fromDate(lastDoc.date);
    q = query(receptionsCollection, orderBy("date", "desc"), startAfter(lastTimestamp), limit(RECEPTIONS_PAGE_SIZE));
  }
  
  const snapshot = await getDocs(q);
  const receptions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as BonReception[];
  
  const lastDocument = snapshot.docs[snapshot.docs.length - 1];
  return {
    receptions,
    lastDoc: lastDocument ? { date: lastDocument.data().date?.toDate() as Date } : null,
    hasMore: snapshot.docs.length === RECEPTIONS_PAGE_SIZE,
  };
}

export async function addReception(reception: Omit<BonReception, "id">): Promise<string> {
  const docRef = await addDoc(receptionsCollection, {
    ...reception,
    date: Timestamp.fromDate(reception.date),
    createdAt: Timestamp.now(),
    operatorEmail: reception.operatorEmail,
  });
  return docRef.id;
}

export async function validateReception(id: string, reception: BonReception, email?: string): Promise<void> {
  const docRef = doc(db, "receptions", id);
  await updateDoc(docRef, { status: "valide", validatedByEmail: email });

  // Update stock for each item
  for (const item of reception.items) {
    const productRef = doc(db, "products", item.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const currentStock = productSnap.data().currentStock || 0;
      await updateDoc(productRef, {
        currentStock: currentStock + item.quantityReceived,
        updatedAt: Timestamp.now(),
      });
    }

    // Add movement
    await addDoc(movementsCollection, {
      type: "entree",
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      quantity: item.quantityReceived,
      reason: "Bon de réception",
      reference: reception.number,
      operator: reception.operator,
      operatorEmail: email || reception.operatorEmail,
      date: Timestamp.fromDate(reception.date),
    });
  }
}

// ==================== BON DE SORTIE ====================
export const sortiesCollection = collection(db, "sorties");

const SORTIES_PAGE_SIZE = 10000;

export async function getSorties(lastDoc?: { date: Date }): Promise<{ sorties: BonSortie[]; lastDoc: { date: Date } | null; hasMore: boolean }> {
  let q = query(sortiesCollection, orderBy("date", "desc"), limit(SORTIES_PAGE_SIZE));
  
  if (lastDoc) {
    const lastTimestamp = Timestamp.fromDate(lastDoc.date);
    q = query(sortiesCollection, orderBy("date", "desc"), startAfter(lastTimestamp), limit(SORTIES_PAGE_SIZE));
  }
  
  const snapshot = await getDocs(q);
  const sorties = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as BonSortie[];
  
  const lastDocument = snapshot.docs[snapshot.docs.length - 1];
  return {
    sorties,
    lastDoc: lastDocument ? { date: lastDocument.data().date?.toDate() as Date } : null,
    hasMore: snapshot.docs.length === SORTIES_PAGE_SIZE,
  };
}

export async function addSortie(sortie: Omit<BonSortie, "id">): Promise<string> {
  const docRef = await addDoc(sortiesCollection, {
    ...sortie,
    date: Timestamp.fromDate(sortie.date),
    createdAt: Timestamp.now(),
    operatorEmail: sortie.operatorEmail,
  });
  return docRef.id;
}

export async function validateSortie(id: string, sortie: BonSortie, email?: string): Promise<void> {
  const docRef = doc(db, "sorties", id);
  await updateDoc(docRef, { status: "valide", validatedByEmail: email });

  // Update stock for each item
  for (const item of sortie.items) {
    const productRef = doc(db, "products", item.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const currentStock = productSnap.data().currentStock || 0;
      await updateDoc(productRef, {
        currentStock: Math.max(0, currentStock - item.quantityDelivered),
        updatedAt: Timestamp.now(),
      });
    }

    // Add movement
    await addDoc(movementsCollection, {
      type: "sortie",
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      quantity: item.quantityDelivered,
      reason: "Bon de sortie",
      reference: sortie.number,
      operator: sortie.operator,
      operatorEmail: email || sortie.operatorEmail,
      date: Timestamp.fromDate(sortie.date),
    });
  }
}

// ==================== INVENTORY ====================
export const inventoriesCollection = collection(db, "inventories");

const INVENTORIES_PAGE_SIZE = 10000;

export async function getInventories(lastDoc?: { startDate: Date }): Promise<{ inventories: Inventory[]; lastDoc: { startDate: Date } | null; hasMore: boolean }> {
  let q = query(inventoriesCollection, orderBy("startDate", "desc"), limit(INVENTORIES_PAGE_SIZE));
  
  if (lastDoc) {
    const lastTimestamp = Timestamp.fromDate(lastDoc.startDate);
    q = query(inventoriesCollection, orderBy("startDate", "desc"), startAfter(lastTimestamp), limit(INVENTORIES_PAGE_SIZE));
  }
  
  const snapshot = await getDocs(q);
  const inventories = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate(),
    endDate: doc.data().endDate?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Inventory[];
  
  const lastDocument = snapshot.docs[snapshot.docs.length - 1];
  return {
    inventories,
    lastDoc: lastDocument ? { startDate: lastDocument.data().startDate?.toDate() as Date } : null,
    hasMore: snapshot.docs.length === INVENTORIES_PAGE_SIZE,
  };
}

export async function addInventory(inventory: Omit<Inventory, "id">): Promise<string> {
  const docRef = await addDoc(inventoriesCollection, {
    ...inventory,
    startDate: Timestamp.fromDate(inventory.startDate),
    createdAt: Timestamp.now(),
    operatorEmail: inventory.operatorEmail,
  });
  return docRef.id;
}

export async function updateInventory(id: string, data: Partial<Inventory>): Promise<void> {
  const docRef = doc(db, "inventories", id);
  const updateData: Record<string, unknown> = { ...data };
  if (data.endDate) {
    updateData.endDate = Timestamp.fromDate(data.endDate);
  }
  await updateDoc(docRef, updateData);
}

export async function validateInventory(id: string, inventory: Inventory, email?: string): Promise<void> {
  const docRef = doc(db, "inventories", id);
  await updateDoc(docRef, {
    status: "valide",
    endDate: Timestamp.now(),
    validatedByEmail: email,
  });

  // Adjust stock based on inventory
  for (const item of inventory.items) {
    if (item.difference !== 0) {
      const productRef = doc(db, "products", item.productId);
      await updateDoc(productRef, {
        currentStock: item.physicalStock,
        updatedAt: Timestamp.now(),
      });

      // Add adjustment movement
      await addDoc(movementsCollection, {
        type: item.difference > 0 ? "entree" : "sortie",
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: Math.abs(item.difference),
        reason: "Ajustement inventaire",
        reference: `INV-${id}`,
        operator: inventory.operator,
        operatorEmail: email || inventory.operatorEmail,
        date: Timestamp.now(),
      });
    }
  }
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  const q = query(productsCollection, orderBy("name"));
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Product[];
    callback(products);
  });
}

// ==================== SUPPLIERS ====================
export const suppliersCollection = collection(db, "suppliers");

export async function getSuppliers(): Promise<Supplier[]> {
  const q = query(suppliersCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Supplier[];
}

export async function addSupplier(supplier: Omit<Supplier, "id">): Promise<string> {
  // If this supplier is main, unset other main suppliers
  if (supplier.isMain) {
    const existingSuppliers = await getSuppliers();
    for (const s of existingSuppliers.filter(s => s.isMain)) {
      const docRef = doc(db, "suppliers", s.id);
      await updateDoc(docRef, { isMain: false });
    }
  }
  
  const docRef = await addDoc(suppliersCollection, {
    ...supplier,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateSupplier(id: string, data: Partial<Supplier>, email?: string): Promise<void> {
  // If setting as main, unset other main suppliers
  if (data.isMain) {
    const existingSuppliers = await getSuppliers();
    for (const s of existingSuppliers.filter(s => s.isMain && s.id !== id)) {
      const docRef = doc(db, "suppliers", s.id);
      await updateDoc(docRef, { isMain: false });
    }
  }
  
  const docRef = doc(db, "suppliers", id);
  await updateDoc(docRef, { 
    ...data, 
    updatedAt: Timestamp.now(),
    updatedByEmail: email,
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  await deleteDoc(doc(db, "suppliers", id));
}

export async function getMainSupplier(): Promise<Supplier | null> {
  const q = query(suppliersCollection, where("isMain", "==", true), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as Supplier;
}

// ==================== OPERATORS ====================
export const operatorsCollection = collection(db, "operators");

export async function getOperators(): Promise<Operator[]> {
  const q = query(operatorsCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Operator[];
}

export async function addOperator(operator: Omit<Operator, "id">): Promise<string> {
  // If this operator is main, unset other main operators
  if (operator.isMain) {
    const existingOperators = await getOperators();
    for (const o of existingOperators.filter(o => o.isMain)) {
      const docRef = doc(db, "operators", o.id);
      await updateDoc(docRef, { isMain: false });
    }
  }
  
  const docRef = await addDoc(operatorsCollection, {
    ...operator,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateOperator(id: string, data: Partial<Operator>, email?: string): Promise<void> {
  // If setting as main, unset other main operators
  if (data.isMain) {
    const existingOperators = await getOperators();
    for (const o of existingOperators.filter(o => o.isMain && o.id !== id)) {
      const docRef = doc(db, "operators", o.id);
      await updateDoc(docRef, { isMain: false });
    }
  }
  
  const docRef = doc(db, "operators", id);
  await updateDoc(docRef, { 
    ...data, 
    updatedAt: Timestamp.now(),
    updatedByEmail: email,
  });
}

export async function deleteOperator(id: string): Promise<void> {
  await deleteDoc(doc(db, "operators", id));
}

export async function getMainOperator(): Promise<Operator | null> {
  const q = query(operatorsCollection, where("isMain", "==", true), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as Operator;
}