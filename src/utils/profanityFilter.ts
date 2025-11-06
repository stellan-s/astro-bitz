/**
 * Profanity filter utility to censor inappropriate words
 */

// List of profane words to filter (can be expanded)
const PROFANITY_LIST = [
  // Common profanity
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt', 'damn', 'hell',
  'bastard', 'slut', 'whore', 'piss', 'crap', 'asshole', 'motherfucker', 'bullshit',
  'prick', 'twat', 'wanker', 'bollocks', 'bugger', 'arsehole', 'arse', 'shite',
  'bloody', 'jackass', 'dumbass', 'dipshit', 'douchebag', 'douche', 'asshat',

  // Sexual/explicit terms
  'tits', 'boobs', 'cum', 'jizz', 'porn', 'sex', 'horny', 'anal', 'blowjob',
  'handjob', 'masturbate', 'orgasm', 'penis', 'vagina', 'testicles', 'balls',
  'clitoris', 'dildo', 'vibrator', 'nude', 'naked', 'erection', 'boner',

  // Slurs and offensive terms
  'fag', 'faggot', 'retard', 'nigger', 'nigga', 'chink', 'spic', 'kike',
  'dyke', 'tranny', 'wetback', 'beaner', 'gook', 'jap', 'negro', 'coon',
  'towelhead', 'raghead', 'cracker', 'honky', 'whitey', 'redskin', 'savage',

  // Body parts (often used inappropriately)
  'booty', 'butt', 'butthole', 'rectum', 'anus', 'scrotum',

  // Drug references
  'weed', 'pot', 'marijuana', 'cocaine', 'heroin', 'meth', 'crack',
  'stoned', 'high', 'druggie', 'pothead', 'crackhead', 'junkie',

  // Violence/threats
  'kill', 'murder', 'rape', 'molest', 'torture', 'genocide', 'holocaust',

  // Religious profanity
  'goddamn', 'jesus', 'christ', 'goddam',

  // Variations and compounds
  'shitty', 'fucked', 'fucking', 'bitchy', 'helluva', 'frick', 'feck',
  'frigging', 'effing', 'screwed', 'suck', 'sucked', 'sucks'
];

/**
 * Creates a regex pattern that matches profanity with common character substitutions
 */
function createProfanityPattern(word: string): RegExp {
  // Replace letters with patterns that match common substitutions
  const pattern = word
    .split('')
    .map(char => {
      switch (char.toLowerCase()) {
        case 'a': return '[a@4]';
        case 'e': return '[e3]';
        case 'i': return '[i1!|]';
        case 'o': return '[o0]';
        case 's': return '[s$5]';
        case 't': return '[t7]';
        case 'l': return '[l1|]';
        default: return char;
      }
    })
    .join('');

  // Match with optional characters between letters and word boundaries
  return new RegExp(`\\b${pattern}\\w*\\b`, 'gi');
}

/**
 * Filters profanity from a string by replacing it with asterisks
 */
export function filterProfanity(text: string): string {
  let filtered = text;

  for (const word of PROFANITY_LIST) {
    const pattern = createProfanityPattern(word);
    filtered = filtered.replace(pattern, (match) => {
      // Replace with asterisks, keeping first character
      return match[0] + '*'.repeat(Math.max(match.length - 1, 2));
    });
  }

  return filtered;
}

/**
 * Checks if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  for (const word of PROFANITY_LIST) {
    const pattern = createProfanityPattern(word);
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}
