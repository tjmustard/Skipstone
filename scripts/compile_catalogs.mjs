import fs from 'fs';
import path from 'path';

const SI_DIR = path.resolve('SI');
const OUT_DIR = path.resolve('src/data/catalogs');
const REGISTRY_PATH = path.resolve('src/data/registry.ts');

fs.mkdirSync(OUT_DIR, { recursive: true });

const deckMetaOverrides = {
  general_edition_v1: {
    aliasId: 'general_edition',
    subtitle: 'Friends, Acquaintances, & Strangers',
    badge: '100 Cards',
    themeColor: 'from-blue-600 to-indigo-700',
    defaultPassAction: 'pass_left'
  },
  dating_courtship_v1: {
    aliasId: 'dating_courtship',
    subtitle: 'Unmasking, Chemistry, & Core Alignment',
    badge: '45 Cards',
    themeColor: 'from-amber-600 to-rose-600',
    defaultPassAction: 'pass_partner'
  },
  lovers_committed_v1: {
    aliasId: 'lovers_committed',
    subtitle: 'Depth, Rekindling, & Sacred Attunement',
    badge: '45 Cards',
    themeColor: 'from-rose-600 to-red-700',
    defaultPassAction: 'pass_partner'
  },
  family_circles_v1: {
    aliasId: 'family_circles',
    subtitle: 'Lore, Legacy, & Collective Healing',
    badge: '45 Cards',
    themeColor: 'from-emerald-600 to-teal-700',
    defaultPassAction: 'pass_left'
  },
  parent_child_5_8_v1: {
    aliasId: 'parent_child_5_8',
    subtitle: 'Wonder & Big Feelings (Ages 5–8)',
    badge: '45 Cards',
    themeColor: 'from-sky-500 to-cyan-600',
    defaultPassAction: 'pass_partner'
  },
  parent_child_9_12_v1: {
    aliasId: 'parent_child_9_12',
    subtitle: 'Bridges & Growing Independence (Ages 9–12)',
    badge: '45 Cards',
    themeColor: 'from-violet-500 to-purple-600',
    defaultPassAction: 'pass_partner'
  },
  parent_child_13_17_v1: {
    aliasId: 'parent_child_13_17',
    subtitle: 'Identity, Freedom, & Unspoken Truths (Ages 13–17)',
    badge: '45 Cards',
    themeColor: 'from-orange-500 to-amber-600',
    defaultPassAction: 'pass_partner'
  },
  parent_child_adult_offspring_v1: {
    aliasId: 'parent_child_adult_offspring',
    subtitle: 'Filial Maturity, Untold Lore, & Peer Connection',
    badge: '45 Cards',
    themeColor: 'from-indigo-600 to-blue-700',
    defaultPassAction: 'pass_partner'
  }
};

const deckFiles = [
  'general_edition_deck.md',
  'dating_early_courtship_deck.md',
  'lovers_committed_romantic_partners_deck.md',
  'family_circles_intergenerational_deck.md',
  'parent_to_child_deck_ages_5_8.md',
  'parent_to_child_deck_ages_9_12.md',
  'parent_to_child_deck_ages_13_17.md',
  'parent_to_child_deck_adult_offspring.md'
];

let totalPromptsCount = 0;
const compiledCatalogs = [];

deckFiles.forEach((file) => {
  const filePath = path.join(SI_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  const rawId = parsed.deckId;
  const meta = deckMetaOverrides[rawId] || {
    aliasId: rawId,
    subtitle: parsed.targetAudience || '',
    badge: `${parsed.prompts.length} Cards`,
    themeColor: 'from-blue-600 to-indigo-700',
    defaultPassAction: parsed.participantMode === 'group_left' ? 'pass_left' : 'pass_partner'
  };

  const cleanPrompts = parsed.prompts.map((p, index) => {
    return {
      id: p.id || `${meta.aliasId}_${index + 1}`,
      tier: Number(p.tier),
      type: p.type === 'wildcard' ? 'wildcard' : 'prompt',
      speakerPrompt: String(p.speakerPrompt || p.speaker || '').trim(),
      listenerPrompt: String(p.listenerPrompt || p.listener || '').trim(),
      passAction: p.passAction || meta.defaultPassAction,
      tags: Array.isArray(p.tags) ? p.tags : []
    };
  });

  const catalog = {
    id: meta.aliasId,
    title: parsed.title.replace(/\s*\([^)]*\)$/, '').trim(), // Clean human title
    subtitle: meta.subtitle,
    description: parsed.description || '',
    targetAudience: parsed.targetAudience || 'General',
    defaultPassAction: meta.defaultPassAction,
    participantMode: parsed.participantMode || 'dyadic',
    themeColor: meta.themeColor,
    badge: meta.badge,
    isCustom: false,
    prompts: cleanPrompts
  };

  const outFileName = `${meta.aliasId}.json`;
  fs.writeFileSync(
    path.join(OUT_DIR, outFileName),
    JSON.stringify(catalog, null, 2),
    'utf-8'
  );

  totalPromptsCount += cleanPrompts.length;
  compiledCatalogs.push(catalog);
  console.log(`Compiled ${outFileName}: ${cleanPrompts.length} prompts.`);
});

console.log(`Total verified prompts across all catalogs: ${totalPromptsCount}`);
if (totalPromptsCount !== 415) {
  console.error(`ERROR: Expected 415 prompts, got ${totalPromptsCount}`);
  process.exit(1);
}

// Generate src/data/registry.ts
const registryContent = `// Auto-generated Catalog Registry
import type { DeckCatalog } from './types';

${compiledCatalogs.map(c => `import ${c.id.replace(/[^a-zA-Z0-9_]/g, '_')}Data from './catalogs/${c.id}.json';`).join('\n')}

export const BUILT_IN_DECKS: DeckCatalog[] = [
${compiledCatalogs.map(c => `  ${c.id.replace(/[^a-zA-Z0-9_]/g, '_')}Data as DeckCatalog,`).join('\n')}
];

export const DECK_REGISTRY: Map<string, DeckCatalog> = new Map();

BUILT_IN_DECKS.forEach((deck) => {
  DECK_REGISTRY.set(deck.id, deck);
  DECK_REGISTRY.set(deck.id + '_v1', deck); // Support v1 alias
});

export function getDeckById(deckId: string): DeckCatalog | undefined {
  return DECK_REGISTRY.get(deckId);
}

export function getAllDecks(customDecks: DeckCatalog[] = []): DeckCatalog[] {
  return [...BUILT_IN_DECKS, ...customDecks];
}
`;

fs.writeFileSync(REGISTRY_PATH, registryContent, 'utf-8');
console.log(`Registry generated at ${REGISTRY_PATH}`);
