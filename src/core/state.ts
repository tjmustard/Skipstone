import type { DeckCatalog, ConversationPrompt, TierLevel, EphemeralSessionPayload } from '../data/types';
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
          soundEnabled: this.state.soundEnabled,
          lastActiveTimestamp: Date.now(),
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
    this.state.drawnPromptIds = [];
    this.state.isRecycled = false;
    this.state.view = 'BRIEFING';
    this.hasShownProgressionForTier = false;
    this.notify();
  }

  public startSession(): void {
    if (!this.state.currentDeck) return;
    this.dealer.loadDeck(this.state.currentDeck, this.state.currentTier);
    const draw = this.dealer.drawNext();

    this.state.activeCard = draw.card;
    this.state.previousCard = null;
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
    if (this.state.view !== 'IN_SESSION' || !this.state.currentDeck) return;

    // Check if 4 cards answered in tier and haven't shown progression modal yet
    if (this.state.cardsAnsweredInTier >= 4 && !this.hasShownProgressionForTier && this.state.currentTier < 3) {
      this.hasShownProgressionForTier = true;
      this.state.view = 'PROGRESSION_MODAL';
      this.notify();
      return;
    }

    const draw = this.dealer.drawNext();
    this.state.previousCard = this.state.activeCard;
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

  public previousCard(): void {
    if (!this.state.previousCard) return;

    // 1-step undo
    const temp = this.state.activeCard;
    this.state.activeCard = this.state.previousCard;
    this.state.previousCard = temp;

    globalSoundEngine.playCardSlide();
    this.notify();
  }

  public advanceTier(): void {
    if (!this.state.currentDeck || this.state.currentTier >= 3) return;

    this.state.currentTier = (this.state.currentTier + 1) as TierLevel;
    this.state.cardsAnsweredInTier = 0;
    this.hasShownProgressionForTier = false;
    this.dealer.setTier(this.state.currentDeck, this.state.currentTier);

    const draw = this.dealer.drawNext();
    this.state.previousCard = null;
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
    this.dealer.setTier(this.state.currentDeck, tier);

    const draw = this.dealer.drawNext();
    this.state.previousCard = null;
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

    const deck = allDecks.find((d) => d.id === saved.deckId) || getDeckById(saved.deckId);
    if (!deck || !saved.activeCard) return false;

    this.state.currentDeck = deck;
    this.state.currentTier = saved.currentTier;
    this.state.cardsAnsweredInTier = saved.cardsAnsweredInTier;
    this.state.activeCard = saved.activeCard;
    this.state.previousCard = saved.previousCard;
    this.state.drawnPromptIds = saved.drawnPromptIds || [];
    this.state.soundEnabled = saved.soundEnabled ?? true;
    this.state.view = 'IN_SESSION';

    this.dealer.loadDeck(deck, saved.currentTier);
    globalSoundEngine.setSoundEnabled(this.state.soundEnabled);

    this.notify();
    return true;
  }
}

export const globalStateMachine = new StateMachine();
