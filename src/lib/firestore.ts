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
  Timestamp,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, StockMovement, BonReception, BonSortie, Inventory } from "./types";

// ==================== PRODUCTS ====================
export const productsCollection = collection(db, "products");

export async function getProducts(): Promise<Product[]> {
  const q = query(productsCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[];
}

export async function addProduct(product: Omit<Product, "id">): Promise<string> {
  const docRef = await addDoc(productsCollection, {
    ...product,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, "products", id);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

// ==================== STOCK MOVEMENTS ====================
export const movementsCollection = collection(db, "movements");

export async function getMovements(): Promise<StockMovement[]> {
  const q = query(movementsCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
  })) as StockMovement[];
}

export async function addMovement(movement: Omit<StockMovement, "id">): Promise<string> {
  const docRef = await addDoc(movementsCollection, {
    ...movement,
    date: Timestamp.fromDate(movement.date),
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

export async function getReceptions(): Promise<BonReception[]> {
  const q = query(receptionsCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as BonReception[];
}

export async function addReception(reception: Omit<BonReception, "id">): Promise<string> {
  const docRef = await addDoc(receptionsCollection, {
    ...reception,
    date: Timestamp.fromDate(reception.date),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function validateReception(id: string, reception: BonReception): Promise<void> {
  const docRef = doc(db, "receptions", id);
  await updateDoc(docRef, { status: "valide" });

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
      date: Timestamp.fromDate(reception.date),
    });
  }
}

// ==================== BON DE SORTIE ====================
export const sortiesCollection = collection(db, "sorties");

export async function getSorties(): Promise<BonSortie[]> {
  const q = query(sortiesCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as BonSortie[];
}

export async function addSortie(sortie: Omit<BonSortie, "id">): Promise<string> {
  const docRef = await addDoc(sortiesCollection, {
    ...sortie,
    date: Timestamp.fromDate(sortie.date),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function validateSortie(id: string, sortie: BonSortie): Promise<void> {
  const docRef = doc(db, "sorties", id);
  await updateDoc(docRef, { status: "valide" });

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
      date: Timestamp.fromDate(sortie.date),
    });
  }
}

// ==================== INVENTORY ====================
export const inventoriesCollection = collection(db, "inventories");

export async function getInventories(): Promise<Inventory[]> {
  const q = query(inventoriesCollection, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate(),
    endDate: doc.data().endDate?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Inventory[];
}

export async function addInventory(inventory: Omit<Inventory, "id">): Promise<string> {
  const docRef = await addDoc(inventoriesCollection, {
    ...inventory,
    startDate: Timestamp.fromDate(inventory.startDate),
    createdAt: Timestamp.now(),
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

export async function validateInventory(id: string, inventory: Inventory): Promise<void> {
  const docRef = doc(db, "inventories", id);
  await updateDoc(docRef, {
    status: "valide",
    endDate: Timestamp.now(),
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
