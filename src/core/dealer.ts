import type { ConversationPrompt, TierLevel, DeckCatalog } from '../data/types';
import { Mulberry32 } from './prng';

export interface DrawResult {
  card: ConversationPrompt;
  isRecycled: boolean;
  isWildcard: boolean;
}

export class SmoothedBernoulliDealer {
  private prng: Mulberry32;
  private currentTier: TierLevel = 1;
  private regularPool: ConversationPrompt[] = [];
  private wildcardPool: ConversationPrompt[] = [];
  private allTierRegular: ConversationPrompt[] = [];
  private allTierWildcard: ConversationPrompt[] = [];
  private cardsSinceWildcard: number = 3; // start eligible for wildcard
  private wildcardProbability: number = 0.12;
  private minSpacing: number = 3;
  private maxDrought: number = 15;

  constructor(deck?: DeckCatalog, seed?: number) {
    this.prng = new Mulberry32(seed !== undefined ? seed : Date.now());
    if (deck) {
      this.loadDeck(deck, 1);
    }
  }

  public setSeed(seed: number): void {
    this.prng = new Mulberry32(seed);
  }

  public loadDeck(deck: DeckCatalog, tier: TierLevel = 1): void {
    this.currentTier = tier;
    this.cardsSinceWildcard = this.minSpacing; // start ready for draw
    this.setupTierPools(deck, tier);
  }

  public setTier(deck: DeckCatalog, tier: TierLevel): void {
    this.currentTier = tier;
    this.cardsSinceWildcard = this.minSpacing;
    this.setupTierPools(deck, tier);
  }

  private setupTierPools(deck: DeckCatalog, tier: TierLevel): void {
    const tierCards = deck.prompts.filter((p) => p.tier === tier);
    this.allTierRegular = tierCards.filter((p) => p.type === 'prompt');
    this.allTierWildcard = tierCards.filter((p) => p.type === 'wildcard');

    // Clone and shuffle
    this.regularPool = this.prng.shuffle([...this.allTierRegular]);
    this.wildcardPool = this.prng.shuffle([...this.allTierWildcard]);
  }

  /**
   * Draws next card with smoothed Bernoulli trial and pool recycling.
   */
  public drawNext(): DrawResult {
    let isRecycled = false;

    // Check if we need to recycle regular pool
    if (this.regularPool.length === 0) {
      this.regularPool = this.prng.shuffle([...this.allTierRegular]);
      isRecycled = true;
    }

    // Check if wildcard pool needs recycle
    if (this.wildcardPool.length === 0 && this.allTierWildcard.length > 0) {
      this.wildcardPool = this.prng.shuffle([...this.allTierWildcard]);
    }

    const hasWildcards = this.wildcardPool.length > 0;
    let shouldDrawWildcard = false;

    if (hasWildcards) {
      if (this.cardsSinceWildcard >= this.maxDrought) {
        // Drought guard reached - force wildcard
        shouldDrawWildcard = true;
      } else if (this.cardsSinceWildcard < this.minSpacing) {
        // Spacing guard - minimum 3 cards spacing violated
        shouldDrawWildcard = false;
      } else {
        // Bernoulli trial
        const roll = this.prng.next();
        shouldDrawWildcard = roll < this.wildcardProbability;
      }
    }

    if (shouldDrawWildcard && hasWildcards) {
      const card = this.wildcardPool.shift()!;
      this.cardsSinceWildcard = 0;
      return { card, isRecycled, isWildcard: true };
    }

    // Default to regular prompt
    if (this.regularPool.length === 0) {
      // In extreme case of no prompts at all in tier, return wildcard or fallback
      if (this.wildcardPool.length > 0) {
        const card = this.wildcardPool.shift()!;
        this.cardsSinceWildcard = 0;
        return { card, isRecycled, isWildcard: true };
      }
      throw new Error(`No cards available for tier ${this.currentTier}`);
    }

    const card = this.regularPool.shift()!;
    this.cardsSinceWildcard++;
    return { card, isRecycled, isWildcard: false };
  }

  public getCardsSinceWildcard(): number {
    return this.cardsSinceWildcard;
  }

  public getCurrentTier(): TierLevel {
    return this.currentTier;
  }
}
