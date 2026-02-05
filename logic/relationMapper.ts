import { RelationType, Member } from '../types';
import { RELATION_LABELS } from '../constants';

/**
 * Normalizes a path for analysis (e.g. Wife's Son -> Son)
 */
const normalizePath = (path: RelationType[]): RelationType[] => {
  const result: RelationType[] = [];
  for (const step of path) {
    const last = result[result.length - 1];
    if ((last === RelationType.SHREEMAN || last === RelationType.SHREEMATI) && 
        (step === RelationType.CHHORA || step === RelationType.CHHORI)) {
      result.pop();
      result.push(step);
      continue;
    }
    result.push(step);
  }
  return result;
};

/**
 * The "Kinship Engine": Given a relationship A -> B (Type), 
 * what is B to A, and what is A to B?
 * This follows the specific 5-point mapping provided by the user.
 */
export const getInferredRelation = (
  from: Member, 
  to: Member, 
  type: RelationType, 
  reverse: boolean = false
): string => {
  const target = reverse ? from : to;
  const isFemale = target.gender === 'female';
  const isMale = target.gender === 'male';

  // If we want the label for 'From' relative to 'To' (The Inverse)
  if (reverse) {
    switch (type) {
      // 1. Primary
      case RelationType.BUWA:
      case RelationType.AMA:
        return isFemale ? 'छोरी' : 'छोरा';
      case RelationType.CHHORA:
      case RelationType.CHHORI:
        return isFemale ? 'आमा' : 'बुवा';
      case RelationType.DAJU:
      case RelationType.BHAI:
        return isFemale ? 'दिदी / बहिनी' : 'दाजु / भाइ';
      case RelationType.DIDI:
      case RelationType.BAHINI:
        return isMale ? 'दाजु / भाइ' : 'दिदी / बहिनी';

      // 2. Maternal
      case RelationType.MAMA:
      case RelationType.MAIJU:
        return isFemale ? 'भान्जी' : 'भान्जा';
      case RelationType.BHANJA:
      case RelationType.BHANJI:
        return isFemale ? 'माइजू' : 'मामा';
      case RelationType.THULI_AMA:
      case RelationType.THULO_BUWA:
        return isFemale ? 'छोरी' : 'छोरा';

      // 3. Paternal
      case RelationType.KAKA:
      case RelationType.KAKI:
      case RelationType.THULO_BUWA:
      case RelationType.THULI_AMA:
        return isFemale ? 'भतिजी' : 'भतिजा';
      case RelationType.BHATIJA:
      case RelationType.BHATIJI:
        return isFemale ? 'काकी / फुपू' : 'काका / ठूलो बुवा';
      case RelationType.FUPU:
      case RelationType.FUPAJU:
        return isFemale ? 'भादै' : 'भादा';
      case RelationType.BHADA:
      case RelationType.BHADAI:
        return isFemale ? 'फुपू' : 'फुपाजु';

      // 4. Spouse & In-laws
      case RelationType.SHREEMAN: return 'श्रीमती';
      case RelationType.SHREEMATI: return 'श्रीमान';
      case RelationType.SASURA:
      case RelationType.SASU:
        return isFemale ? 'बुहारी' : 'ज्वाईं';
      case RelationType.JWAI:
      case RelationType.BUHARI:
        return isFemale ? 'सासू' : 'ससुरा';
      case RelationType.SALO:
      case RelationType.SALI:
      case RelationType.JETHAN:
        return 'भेना / ज्वाईं';
      case RelationType.BHENA:
        return isFemale ? 'साली / जेठानी' : 'सालो / जेठान';
      case RelationType.NANDA: return 'बुहारी';

      // 5. Multi-Generational
      case RelationType.BAJE:
      case RelationType.BAJYAI:
        return isFemale ? 'नातिनी' : 'नाति';
      case RelationType.PANATI:
      case RelationType.PANATINI:
        return isFemale ? 'ज्युज्यु बज्यै' : 'ज्युज्यु बाजे';

      default: return RELATION_LABELS[type] || 'नाता';
    }
  }

  // Standard forward label
  return RELATION_LABELS[type];
};

export const generateAIPrompt = (
  rawPath: RelationType[], 
  membersInPath: Member[],
  targetMember: Member
): string => {
  const sourceMember = membersInPath[0];
  const normalized = normalizePath(rawPath);
  
  let prompt = `You are a high-level Nepali Kinship Expert. Determine the exact relationship term for Person B relative to Person A based on the following rules:\n\n`;
  
  prompt += `REQUIRED MAPPING RULES:\n`;
  prompt += `1. Primary: Aama/Buwa <-> Chora/Chori, Dai/Bhai <-> Didi/Bahini.\n`;
  prompt += `2. Maternal: Mama/Maiju <-> Bhanja/Bhanji (Sister's kids). Sani-aama/Thuli-aama (Mother's sister) <-> her sister's kids.\n`;
  prompt += `3. Paternal: Kaka/Thulobuwa <-> Bhatijo/Bhatiji (Brother's kids). Phupu/Phupaju <-> Bhada/Bhadai (Brother's kids see Father's sister as Phupu).\n`;
  prompt += `4. In-Laws: Sasura <-> Jwain (Son-in-law). Sasu <-> Buhari (Daughter-in-law). Jethan/Salo/Sali <-> Bhena/Jwain.\n`;
  prompt += `5. Generations: Hajurama/Baje <-> Nati/Natini. Jyu-jyu Baje <-> Pan-nati. Khapati <-> Khapati-nati.\n\n`;

  prompt += `CONTEXT:\n`;
  prompt += `- Person A (Source): ${sourceMember.name} (Gender: ${sourceMember.gender})\n`;
  prompt += `- Person B (Target): ${targetMember.name} (Gender: ${targetMember.gender})\n`;
  prompt += `- Step-by-step path: ${normalized.map(t => RELATION_LABELS[t]).join(' -> ')}\n\n`;

  prompt += `INSTRUCTION:\n`;
  prompt += `Return ONLY the specific Nepali term and its common English transliteration. Format: "Term (Transliteration)". Do not explain.`;

  return prompt;
};

export const resolveDirectRelationship = (
  rawPath: RelationType[], 
  membersInPath: Member[],
  targetGender?: 'male' | 'female' | 'other'
): string => {
  if (rawPath.length === 0) return 'आफै (Self)';
  const path = normalizePath(rawPath);
  const isMale = targetGender === 'male';
  
  if (path.length === 1) return RELATION_LABELS[path[0]];
  
  const pathStr = path.join(',');
  if (pathStr === 'ama,mama') return 'मामा (Mama)';
  if (pathStr === 'buwa,fupu') return 'फुपू (Phupu)';
  if (pathStr === 'buwa,daju' || pathStr === 'buwa,bhai') return 'काका / ठूलो बुवा';
  if (pathStr === 'ama,didi' || pathStr === 'ama,bahini') return 'सानी आमा / ठूली आमा';

  return isMale ? 'नातेदार (पुरुष)' : 'नातेदार (महिला)';
};
