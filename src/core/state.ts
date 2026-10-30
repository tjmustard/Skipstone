import type {
  DeckCatalog,
  ConversationPrompt,
  TierLevel,
  EphemeralSessionPayload,
  ActionType,
} from '../data/types';
import { getDeckById } from '../data/registry';
import { SmoothedBernoulliDealer } from './dealer';
import { globalSoundEngine } from './audio';
import { EphemeralStorageManager } from './storage';

export type AppView = 'DECK_SELECT' | 'BRIEFING' | 'IN_SESSION' | 'PROGRESSION_MODAL' | 'GROUNDING_CHECKOUT';

export interface AppState {
  view: AppView;
  currentDeck: DeckCatalog | null;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  activeCard: ConversationPrompt | null;
  previousCard: ConversationPrompt | null;
  activeRole?: string | null;
  startingRole?: string | null;
  previousRole?: string | null;
  previousActionType?: ActionType | null;
  hasUndoAvailable?: boolean;
  drawnPromptIds: string[];
  soundEnabled: boolean;
  isRecycled: boolean;
  checkoutStep: 1 | 2 | 3;
}

export type StateListener = (state: AppState) => void;

export class StateMachine {
  private state: AppState;
  private dealer: SmoothedBernoulliDealer;
  private listeners: Set<StateListener> = new Set();
  private hasShownProgressionForTier: boolean = false;
  private isTransitioning: boolean = false;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private boundBeforeUnload: (e: BeforeUnloadEvent) => void;

  constructor(initialSeed?: number) {
    this.dealer = new SmoothedBernoulliDealer(undefined, initialSeed);
    this.state = {
      view: 'DECK_SELECT',
      currentDeck: null,
      currentTier: 1,
      cardsAnsweredInTier: 0,
      activeCard: null,
      previousCard: null,
      activeRole: null,
      startingRole: null,
      previousRole: null,
      previousActionType: null,
      hasUndoAvailable: false,
      drawnPromptIds: [],
      soundEnabled: true,
      isRecycled: false,
      checkoutStep: 1,
    };

    this.boundBeforeUnload = (e: BeforeUnloadEvent) => {
      if (this.state.view === 'IN_SESSION' || this.state.view === 'PROGRESSION_MODAL') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    this.attachBeforeUnload();
  }

  private attachBeforeUnload(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.boundBeforeUnload);
    }
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public getDealer(): SmoothedBernoulliDealer {
    return this.dealer;
  }

  public getHasShownProgressionForTier(): boolean {
    return this.hasShownProgressionForTier;
  }

  public getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  public resetTransitionLockout(): void {
    this.isTransitioning = false;
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  public canSkip(): boolean {
    return this.dealer.canSkip(this.state.activeRole ?? undefined);
  }

  private startTransitionLockout(durationMs: number = 350): void {
    this.isTransitioning = true;
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.transitionTimer = setTimeout(() => {
      this.isTransitioning = false;
      this.transitionTimer = null;
    }, durationMs);
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));

    // Auto-persist ephemeral session if in active game view
    if (this.state.view === 'IN_SESSION' || this.state.view === 'PROGRESSION_MODAL') {
      if (this.state.currentDeck && this.state.activeCard) {
        const payload: EphemeralSessionPayload = {
          deckId: this.state.currentDeck.id,
          currentTier: this.state.currentTier,
          cardsAnsweredInTier: this.state.cardsAnsweredInTier,
          drawnPromptIds: this.state.drawnPromptIds,
          activeCard: this.state.activeCard,
          previousCard: this.state.previousCard,
          activeRole: this.state.activeRole,
          startingRole: this.state.startingRole,
          previousRole: this.state.previousRole,
          previousActionType: this.state.previousActionType,
          soundEnabled: this.state.soundEnabled,
          lastActiveTimestamp: Date.now(),
          hasShownProgressionForTier: this.hasShownProgressionForTier,
        };
        EphemeralStorageManager.saveSession(payload);
      }
    }
  }

  public selectDeck(deck: DeckCatalog): void {
    this.state.currentDeck = deck;
    this.state.currentTier = 1;
    this.state.cardsAnsweredInTier = 0;
    this.state.activeCard = null;
    this.state.previousCard = null;
    this.state.activeRole = deck.isBilateral ? (deck.roleA ?? null) : null;
    this.state.startingRole = deck.isBilateral ? (deck.roleA ?? null) : null;
    this.state.previousRole = null;
    this.state.previousActionType = null;
    this.state.hasUndoAvailable = false;
    this.state.drawnPromptIds = [];
    this.state.isRecycled = false;
    this.state.view = 'BRIEFING';
    this.hasShownProgressionForTier = false;
    this.notify();
  }

  public setStarterRole(role: string): void {
    if (!this.state.currentDeck?.isBilateral) return;
    this.state.startingRole = role;
    this.state.activeRole = role;
    this.notify();
  }

  public startSession(deckIdOrStarterRole?: string, starterRoleArg?: string): void {
    let resolvedStarterRole: string | undefined = starterRoleArg;

    if (deckIdOrStarterRole) {
      const matchedDeck = getDeckById(deckIdOrStarterRole);
      if (matchedDeck) {
        this.selectDeck(matchedDeck);
      } else {
        // Argument was a starter role string
        resolvedStarterRole = deckIdOrStarterRole;
      }
    }

    if (!this.state.currentDeck) return;

    // Resolve bilateral roles
    if (this.state.currentDeck.isBilateral) {
      const selectedRole =
        resolvedStarterRole ||
        this.state.startingRole ||
        this.state.currentDeck.roleA ||
        'roleA';
      this.state.startingRole = selectedRole;
      this.state.activeRole = selectedRole;
    } else {
      this.state.startingRole = null;
      this.state.activeRole = null;
    }

    this.dealer.loadDeck(this.state.currentDeck, this.state.currentTier);
    const draw = this.dealer.drawNext(this.state.activeRole ?? undefined);

    this.state.activeCard = draw.card;
    this.state.previousCard = null;
    this.state.previousRole = null;
    this.state.previousActionType = null;
    this.state.hasUndoAvailable = false;
    this.state.cardsAnsweredInTier = 1;
    this.state.drawnPromptIds = [draw.card.id];
    this.state.isRecycled = draw.isRecycled;
    this.state.view = 'IN_SESSION';
    this.hasShownProgressionForTier = false;

    if (draw.isWildcard) {
      globalSoundEngine.playWildcardChime();
    } else {
      globalSoundEngine.playCardSlide();
    }

    this.notify();
  }

  public nextCard(): void {
    if (this.isTransitioning) return;
    if (this.state.view !== 'IN_SESSION' || !this.state.currentDeck || !this.state.activeCard) return;

    // Check if 4 cards answered in tier and haven't shown progression modal yet
    if (this.state.cardsAnsweredInTier >= 4 && !this.hasShownProgressionForTier && this.state.currentTier < 3) {
      this.hasShownProgressionForTier = true;
      this.state.view = 'PROGRESSION_MODAL';
      this.notify();
      return;
    }

    this.startTransitionLockout();

    // Record in undo ledger
    this.state.previousCard = this.state.activeCard;
    this.state.previousRole = this.state.activeRole;
    this.state.previousActionType = 'NEXT';
    this.state.hasUndoAvailable = true;

    // Alternate role for bilateral decks
    if (this.state.currentDeck.isBilateral && this.state.currentDeck.roleA && this.state.currentDeck.roleB) {
      const nextRole =
        this.state.activeRole === this.state.currentDeck.roleA
          ? this.state.currentDeck.roleB
          : this.state.currentDeck.roleA;
      this.state.activeRole = nextRole;
    }

    const draw = this.dealer.drawNext(this.state.activeRole ?? undefined);
    this.state.activeCard = draw.card;
    this.state.cardsAnsweredInTier++;
    this.state.drawnPromptIds.push(draw.card.id);
    this.state.isRecycled = draw.isRecycled;

    if (draw.isWildcard) {
      globalSoundEngine.playWildcardChime();
    } else {
      globalSoundEngine.playCardSlide();
    }

    this.notify();
  }

  public skipCard(): void {
    if (this.isTransitioning) return;
    if (this.state.view !== 'IN_SESSION' || !this.state.currentDeck || !this.state.activeCard) return;

    this.startTransitionLockout();

    // Record in undo ledger
    this.state.previousCard = this.state.activeCard;
    this.state.previousRole = this.state.activeRole;
    this.state.previousActionType = 'SKIP';
    this.state.hasUndoAvailable = true;

    // Draw next card for current activeRole via dealer.skipCurrent
    const draw = this.dealer.skipCurrent(
      this.state.activeCard,
      this.state.activeRole ?? undefined
    );

    this.state.activeCard = draw.card;
    this.state.drawnPromptIds.push(draw.card.id);
    this.state.isRecycled = draw.isRecycled;

    // Maintain cardsAnsweredInTier and activeRole unchanged
    globalSoundEngine.playCardSkip();
    this.notify();
  }

  public previousCard(): void {
    if (this.isTransitioning) return;
    if (!this.state.hasUndoAvailable || !this.state.previousCard) return;

    this.startTransitionLockout();

    const restoredCard = this.state.previousCard;
    const actionType = this.state.previousActionType;

    if (actionType === 'NEXT') {
      if (this.state.cardsAnsweredInTier > 1) {
        this.state.cardsAnsweredInTier--;
      }
      if (this.state.previousRole) {
        this.state.activeRole = this.state.previousRole;
      }
    } else if (actionType === 'SKIP') {
      // Restore card while leaving cardsAnsweredInTier and activeRole unchanged
    }

    this.state.activeCard = restoredCard;
    this.state.previousCard = null;
    this.state.previousRole = null;
    this.state.previousActionType = null;
    this.state.hasUndoAvailable = false;

    globalSoundEngine.playCardSlide();
    this.notify();
  }

  public advanceTier(): void {
    if (!this.state.currentDeck || this.state.currentTier >= 3) return;

    this.state.currentTier = (this.state.currentTier + 1) as TierLevel;
    this.state.cardsAnsweredInTier = 0;
    this.hasShownProgressionForTier = false;
    this.state.previousCard = null;
    this.state.previousRole = null;
    this.state.previousActionType = null;
    this.state.hasUndoAvailable = false;
    this.dealer.setTier(this.state.currentDeck, this.state.currentTier);

    const draw = this.dealer.drawNext(this.state.activeRole ?? undefined);
    this.state.activeCard = draw.card;
    this.state.cardsAnsweredInTier = 1;
    this.state.drawnPromptIds.push(draw.card.id);
    this.state.isRecycled = draw.isRecycled;
    this.state.view = 'IN_SESSION';

    globalSoundEngine.playTierAdvance();
    this.notify();
  }

  public stayInCurrentTier(): void {
    this.state.view = 'IN_SESSION';
    this.notify();
  }

  public setTier(tier: TierLevel): void {
    if (!this.state.currentDeck) return;
    this.state.currentTier = tier;
    this.state.cardsAnsweredInTier = 0;
    this.hasShownProgressionForTier = false;
    this.state.previousCard = null;
    this.state.previousRole = null;
    this.state.previousActionType = null;
    this.state.hasUndoAvailable = false;
    this.dealer.setTier(this.state.currentDeck, tier);

    const draw = this.dealer.drawNext(this.state.activeRole ?? undefined);
    this.state.activeCard = draw.card;
    this.state.cardsAnsweredInTier = 1;
    this.state.drawnPromptIds.push(draw.card.id);
    this.state.isRecycled = draw.isRecycled;
    this.state.view = 'IN_SESSION';

    globalSoundEngine.playTierAdvance();
    this.notify();
  }

  public startGroundingCheckout(): void {
    this.state.view = 'GROUNDING_CHECKOUT';
    this.state.checkoutStep = 1;
    globalSoundEngine.playFinishGrounding();
    this.notify();
  }

  public nextCheckoutStep(): void {
    if (this.state.checkoutStep === 1) {
      this.state.checkoutStep = 2;
      this.notify();
    } else if (this.state.checkoutStep === 2) {
      this.state.checkoutStep = 3;
      // WIPE ephemeral session storage on final step
      EphemeralStorageManager.clearSession();
      this.notify();
    } else {
      // Step 3 completed -> back to deck select
      this.quitToDeckSelect();
    }
  }

  public quitToDeckSelect(): void {
    EphemeralStorageManager.clearSession();
    this.state.view = 'DECK_SELECT';
    this.state.currentDeck = null;
    this.state.activeCard = null;
    this.state.previousCard = null;
    this.state.activeRole = null;
    this.state.startingRole = null;
    this.state.previousRole = null;
    this.state.previousActionType = null;
    this.state.hasUndoAvailable = false;
    this.state.cardsAnsweredInTier = 0;
    this.state.drawnPromptIds = [];
    this.state.isRecycled = false;
    this.hasShownProgressionForTier = false;
    this.notify();
  }

  public toggleSound(): void {
    this.state.soundEnabled = !this.state.soundEnabled;
    globalSoundEngine.setSoundEnabled(this.state.soundEnabled);
    this.notify();
  }

  public tryRestoreSession(allDecks: DeckCatalog[]): boolean {
    const saved = EphemeralStorageManager.loadSession();
    if (!saved) return false;

    // Validate deck existence
    const deck = allDecks.find((d) => d.id === saved.deckId) || getDeckById(saved.deckId);
    if (!deck || !saved.activeCard) {
      EphemeralStorageManager.clearSession();
      return false;
    }

    // Validate tier
    if (![1, 2, 3].includes(saved.currentTier)) {
      EphemeralStorageManager.clearSession();
      return false;
    }

    // Validate activeCard matches catalog prompt and currentTier
    const cardExists = deck.prompts.some(
      (p) => p.id === saved.activeCard?.id && p.tier === saved.currentTier
    );
    if (!cardExists) {
      EphemeralStorageManager.clearSession();
      return false;
    }

    // Validate bilateral role constraints
    if (deck.isBilateral && saved.activeRole) {
      if (saved.activeRole !== deck.roleA && saved.activeRole !== deck.roleB) {
        EphemeralStorageManager.clearSession();
        return false;
      }
    }

    // Validate drawnPromptIds against catalog
    if (saved.drawnPromptIds && Array.isArray(saved.drawnPromptIds)) {
      const catalogPromptIds = new Set(deck.prompts.map((p) => p.id));
      const allValid = saved.drawnPromptIds.every((id) => catalogPromptIds.has(id));
      if (!allValid) {
        EphemeralStorageManager.clearSession();
        return false;
      }
    }

    this.state.currentDeck = deck;
    this.state.currentTier = saved.currentTier;
    this.state.cardsAnsweredInTier = saved.cardsAnsweredInTier;
    this.state.activeCard = saved.activeCard;
    this.state.previousCard = saved.previousCard;
    this.state.activeRole = saved.activeRole ?? (deck.isBilateral ? deck.roleA ?? null : null);
    this.state.startingRole = saved.startingRole ?? (deck.isBilateral ? deck.roleA ?? null : null);
    this.state.previousRole = saved.previousRole ?? null;
    this.state.previousActionType = saved.previousActionType ?? null;
    this.state.hasUndoAvailable = Boolean(saved.previousCard);
    this.state.drawnPromptIds = saved.drawnPromptIds || [];
    this.state.soundEnabled = saved.soundEnabled ?? true;
    this.state.view = 'IN_SESSION';
    this.hasShownProgressionForTier = saved.hasShownProgressionForTier ?? false;

    // Rehydrate dealer filtering already-drawn prompt IDs
    this.dealer.loadDeck(deck, saved.currentTier, this.state.drawnPromptIds);
    globalSoundEngine.setSoundEnabled(this.state.soundEnabled);

    this.notify();
    return true;
  }
}

export const globalStateMachine = new StateMachine();
