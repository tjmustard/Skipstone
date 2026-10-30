// Auto-generated Catalog Registry
import type { DeckCatalog } from './types';

import general_editionData from './catalogs/general_edition.json';
import dating_courtshipData from './catalogs/dating_courtship.json';
import lovers_committedData from './catalogs/lovers_committed.json';
import family_circlesData from './catalogs/family_circles.json';
import parent_child_5_8Data from './catalogs/parent_child_5_8.json';
import parent_child_9_12Data from './catalogs/parent_child_9_12.json';
import parent_child_13_17Data from './catalogs/parent_child_13_17.json';
import parent_child_adult_offspringData from './catalogs/parent_child_adult_offspring.json';

export const BUILT_IN_DECKS: DeckCatalog[] = [
  general_editionData as DeckCatalog,
  dating_courtshipData as DeckCatalog,
  lovers_committedData as DeckCatalog,
  family_circlesData as DeckCatalog,
  parent_child_5_8Data as DeckCatalog,
  parent_child_9_12Data as DeckCatalog,
  parent_child_13_17Data as DeckCatalog,
  parent_child_adult_offspringData as DeckCatalog,
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
