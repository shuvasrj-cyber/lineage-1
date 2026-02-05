
export enum RelationType {
  BUWA = 'buwa',
  AMA = 'ama',
  CHHORA = 'chhora',
  CHHORI = 'chhori',
  BAJE = 'baje',
  BAJYAI = 'bajyai',
  PANATI = 'panati',
  PANATINI = 'panatini',
  SASURA = 'sasura',
  SASU = 'sasu',
  JETHAN = 'jethan',
  SALO = 'salo',
  JETHANI = 'jethani',
  SALI = 'sali',
  JWAI = 'jwai',
  BUHARI = 'buhari',
  KAKA = 'kaka',
  KAKI = 'kaki',
  THULO_BUWA = 'thulo buwa',
  THULI_AMA = 'thuli ama',
  MAMA = 'mama',
  MAIJU = 'maiju',
  FUPU = 'fupu',
  FUPAJU = 'fupaju',
  BHATIJA = 'bhatija',
  BHATIJI = 'bhatiji',
  BHANJA = 'bhanja',
  BHANJI = 'bhanji',
  SAMDHI = 'samdhi',
  SAMDHINI = 'samdhini',
  DEWAR = 'dewar',
  NANDA = 'nanda',
  SHREEMAN = 'shreeman',
  SHREEMATI = 'shreemati'
}

export interface Member {
  id: string;
  name: string;
  address: string;
  mobile: string;
  photo?: string;
  gender: 'male' | 'female' | 'other';
  createdAt: number;
}

export interface Relation {
  id: string;
  fromId: string;
  toId: string;
  type: RelationType;
}

export type AppView = 'home' | 'add_member' | 'link_members' | 'tree_view';
