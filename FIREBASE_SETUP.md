# Guide de configuration Firebase

Ce guide explique comment obtenir les identifiants Firebase et configurer la base de données pour l'application StockManager.

## 1. Création d'un projet Firebase

1. Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez sur "Ajouter un projet" ou "Add project"
3. Donnez un nom à votre projet (ex: `stockmanager-app`)
4. Désactivez Google Analytics (optionnel, pour simplifier)
5. Cliquez sur "Créer le projet"

## 2. Activation de Firebase Authentication

1. Dans le menu de gauche, allez dans **Authentication** (ou "Authentification")
2. Cliquez sur "Commencer" / "Get started"
3. Allez dans l'onglet **Méthode de connexion** / "Sign-in method"
4. Cliquez sur "Email/Password" (Email/Mot de passe)
5. Activez le toggle "Activer" / "Enable"
6. Configurez :
   - **Email/Mot de passe** : ACTIVÉ
   - (Optionnel) "Email link (passwordless sign-in)" : désactivé
7. Cliquez sur "Enregistrer"

## 3. Activation de Cloud Firestore

1. Dans le menu de gauche, allez dans **Firestore Database**
2. Cliquez sur "Créer une base de données" / "Create database"
3. Choisissez un emplacement (ex: `europe-west1` - Belgium)
4. Sélectionnez "Mode de test" / "Start in test mode" pour commencer
5. Cliquez sur "Créer"

> **Important** : En mode test, tout le monde peut lire/écrire pendant 30 jours. Pour la production, vous configured des règles de sécurité.

## 4. Obtention des identifiants

1. Dans le menu de gauche, allez dans les **Paramètres du projet** (icône ⚙️ à côté de "Project Overview")
2. Faites défiler jusqu'à "Vos applications" / "Your apps"
3. Cliquez sur l'icône **`</>`** (Web)
4. Enregistrez l'app avec un nom (ex: `stockmanager-web`)
5. Copiez l'objet `firebaseConfig` qui contient :

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

## 5. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Remplacez les valeurs par celles copiées depuis la console Firebase.

## 6. Structure de la base de données Firestore

L'application crée automatiquement les collections nécessaires. Voici la structure attendue :

### Collection `users`

```json
{
  "uid": "abc123...",
  "email": "admin@stockmanager.com",
  "displayName": "Administrateur",
  "role": "admin",
  "permissions": ["dashboard", "mouvements", "reception", "sortie", "inventaire", "produits"],
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Collection `products` (Produits)

```json
{
  "id": "prod_001",
  "name": "Produit A",
  "category": "Catégorie 1",
  "unit": "pcs",
  "currentStock": 100,
  "minStock": 10,
  "price": 25.99,
  "barcode": "123456789",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Collection `movements` (Mouvements de stock)

```json
{
  "id": "mov_001",
  "type": "entree" | "sortie",
  "productId": "prod_001",
  "productName": "Produit A",
  "quantity": 50,
  "date": "2024-01-15T10:30:00.000Z",
  "reference": "BR-2024-001",
  "notes": "Bon de réception",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Collection `bons` (Bons de réception et de sortie)

```json
{
  "id": "br_001",
  "type": "reception" | "sortie",
  "numero": "BR-2024-001",
  "date": "2024-01-15",
  "fournisseur": "Fournisseur XYZ",
  "items": [
    {
      "productId": "prod_001",
      "productName": "Produit A",
      "quantity": 50,
      "unitPrice": 25.99
    }
  ],
  "total": 1299.50,
  "status": "validé",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "user_uid"
}
```

### Collection `inventaires`

```json
{
  "id": "inv_001",
  "type": "annuel" | "intermediaire",
  "numero": "INV-2024-001",
  "date": "2024-01-31",
  "status": "termine",
  "items": [
    {
      "productId": "prod_001",
      "productName": "Produit A",
      "systemStock": 100,
      "physicalStock": 98,
      "difference": -2
    }
  ],
  "notes": "Inventaire annuel 2024",
  "createdAt": "2024-01-31T09:00:00.000Z",
  "createdBy": "user_uid"
}
```

## 7. Régles de sécurité Firestore (Optionnel - pour production)

Quand vous êtes prêt pour la production, allez dans l'onglet "Règles" de Firestore et utilisez ces règles :

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Utilisateurs: seul l'admin peut voir/modifier tous les utilisateurs
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Produits: utilisateurs actifs seulement
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Mouvements: utilisateurs actifs avec permission
    match /movements/{movementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Bons: utilisateurs actifs avec permission
    match /bons/{bonId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Inventaires: utilisateurs actifs avec permission
    match /inventaires/{inventaireId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

## 8. Premier lancement

1. Configurez les variables d'environnement dans `.env.local`
2. Lancez l'application : `bun dev`
3. Ouvrez `http://localhost:3000`
4. Le compte admin sera automatiquement créé :
   - **Email** : `admin@stockmanager.com`
   - **Mot de passe** : `Admin@123`
5. Connectez-vous avec ces identifiants

## Dépannage

### "Firebase Error: Auth/wrong-password"
- Le mot de passe est incorrect
- Ou le compte a été désactivé (vérifiez dans Firestore > collection `users` > champ `active: true`)

### "Firebase Error: Auth/user-not-found"
- L'utilisateur n'existe pas dans Firebase Auth
- OU le profil n'existe pas dans Firestore (collection `users`)

### "Permission denied"
- Vérifiez que Firestore est en mode test OU que les règles permettent l'accès
- Vérifiez que Authentication (Email/Password) est activé dans la console

### Les données n'apparaissent pas
- Vérifiez que vous avez créé les collections dans Firestore
- L'application crée automatiquement les produits et mouvements, mais vous pouvez en ajouter manuellement via l'interface Firestore
