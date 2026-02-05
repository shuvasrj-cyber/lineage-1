
import { Member, Relation } from './types';

const DB_NAME = 'FamilyLineageDB';
const DB_VERSION = 1;
const STORE_MEMBERS = 'members';
const STORE_RELATIONS = 'relations';

export class FamilyDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MEMBERS)) {
          db.createObjectStore(STORE_MEMBERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_RELATIONS)) {
          db.createObjectStore(STORE_RELATIONS, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMembers(): Promise<Member[]> {
    return this.getAll<Member>(STORE_MEMBERS);
  }

  async addMember(member: Member): Promise<void> {
    return this.add(STORE_MEMBERS, member);
  }

  async getAllRelations(): Promise<Relation[]> {
    return this.getAll<Relation>(STORE_RELATIONS);
  }

  async addRelation(relation: Relation): Promise<void> {
    return this.add(STORE_RELATIONS, relation);
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async add(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new FamilyDatabase();
