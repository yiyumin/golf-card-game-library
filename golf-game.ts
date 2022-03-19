import {
  Card,
  PlayerCard,
  PlayerWithCards,
  PlayerWithPlayerCards,
  GameState,
  RoundState,
  TurnState,
} from './types';
import { shuffle } from './utils';
import { getShuffledDeck, calculateScore } from './deck-helper';

class GolfGame {
  players: Map<string, PlayerWithCards>;

  gamePlayerIds: string[];
  roundPlayerIds: string[];

  gameState: GameState;
  roundState: RoundState;
  turnState: TurnState;

  gameDealerIdx: number;
  roundPlayerTurnIdx: number;

  gameWord: string;

  drawPile: Card[];
  discardPile: Card[];
  takenCard: Card;

  golfCallerId?: string;
  gameWinnerId?: string;
  roundLoserIds?: string[];

  constructor() {
    this.players = new Map();

    this.gamePlayerIds = [];

    this.gameState = 'not_started';
    this.roundState = 'not_started';
    this.turnState = 'not_started';

    this.gameDealerIdx = -1;

    this.gameWord = 'GOLF';

    this.drawPile = [];
    this.discardPile = [];
  }

  getGamePlayerIds() {
    return this.gamePlayerIds;
  }

  getRoundPlayerIds() {
    return this.roundPlayerIds;
  }

  getPlayerTurnId() {
    if (!this.roundPlayerIds) return;

    return this.roundPlayerIds[this.roundPlayerTurnIdx];
  }

  getGameState() {
    return this.gameState;
  }

  getTurnState() {
    return this.turnState;
  }

  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  isRoundFinished() {
    return this.golfCallerId && this.getPlayerTurnId() === this.golfCallerId;
  }

  isGameStarted() {
    return this.gameState === 'started' || this.gameState === 'finished';
  }

  isGameFinished() {
    return this.gameState === 'finished';
  }

  startRound() {
    this.roundState = 'started';
  }

  finishTurn() {
    this.incrementRoundPlayerTurnIdx();
    this.turnState = 'not_started';
  }

  callGolf(playerId: string) {
    this.golfCallerId = playerId;
    this.incrementRoundPlayerTurnIdx();
    this.turnState = 'not_started';
  }

  getDiscardPile() {
    return this.discardPile;
  }

  getDiscardPileTopCard() {
    return this.discardPile.at(-1);
  }

  getDrawPileTopCard() {
    return this.drawPile.at(-1);
  }

  getDrawPileCardCount() {
    return this.drawPile.length;
  }

  takeFromDiscardPile() {
    this.turnState = 'card_taken';
    this.takenCard = this.getDiscardPileTopCard();
    return this.discardPile.pop();
  }

  takeFromDrawPile() {
    if (!this.drawPile) return;

    this.turnState = 'card_taken';
    this.takenCard = this.getDrawPileTopCard();
    return this.drawPile.pop();
  }

  swapCard(playerId, swapCardIdx) {
    if (!this.takenCard) return;

    this.turnState = 'card_discarded';
    this.discardPile.push(this.players.get(playerId).cards[swapCardIdx]);
    this.players.get(playerId).cards[swapCardIdx] = this.takenCard;
    this.takenCard = undefined;
  }

  discardCard() {
    if (!this.takenCard) return;

    this.turnState = 'card_discarded';
    this.discardPile.push(this.takenCard);
    this.takenCard = undefined;
  }

  // get all players except for player with id: playerId
  getPlayers(playerId: string): PlayerWithPlayerCards[] {
    // reorder players so player with id: playerId would be last
    const gamePlayerIdx = this.gamePlayerIds.indexOf(playerId);
    const orderedGamePlayerIds = this.gamePlayerIds
      .slice(gamePlayerIdx + 1)
      .concat(this.gamePlayerIds.slice(0, gamePlayerIdx));

    return orderedGamePlayerIds.map((id) => {
      let cards: PlayerCard[] = this.players.get(id).cards;

      if (
        cards &&
        (this.roundState === 'cards_dealt' || this.roundState === 'started')
      ) {
        cards = ['facedown', 'facedown', 'facedown', 'facedown'];
      }

      return { ...this.players.get(id), cards };
    });
  }

  getPlayer(playerId): PlayerWithPlayerCards {
    let cards: PlayerCard[] = this.players.get(playerId).cards;

    if (cards) {
      if (this.roundState === 'started') {
        cards = ['facedown', 'facedown', 'facedown', 'facedown'];
      } else if (this.roundState === 'cards_dealt') {
        cards = [
          'facedown',
          'facedown',
          ...this.players.get(playerId).cards.slice(-2),
        ];
      }
    }

    return { ...this.players.get(playerId), cards };
  }

  getDealtCardsForPlayer(playerId: string): PlayerCard[] {
    if (!this.roundPlayerIds.includes(playerId)) return;

    return [
      'facedown',
      'facedown',
      ...this.players.get(playerId).cards.slice(-2),
    ];
  }

  getStateForPlayer(playerId: string) {
    return {
      player: this.getPlayer(playerId),
      players: this.getPlayers(playerId),
      gameState: this.gameState,
      roundState: this.roundState,
      turnState: this.turnState,
      gameWord: this.gameWord,
      playerTurnId: this.getPlayerTurnId(),
      discardPile: this.discardPile,
      drawPileCardCount: this.drawPile.length,
      takenCard:
        playerId === this.getPlayerTurnId() ? this.takenCard : undefined,
      golfCallerId: this.golfCallerId,
      gameWinnerId: this.gameWinnerId,
      roundLoserIds: this.roundLoserIds,
    };
  }

  changeName(playerId: string, name: string) {
    this.players.get(playerId).name = name;
  }

  changeGameWord(gameWord: string) {
    this.gameWord = gameWord;
  }

  isPlayerGameReady(playerId: string): boolean {
    return this.players.get(playerId).isGameReady;
  }

  isPlayerRoundReady(playerId: string): boolean {
    return this.players.get(playerId).isRoundReady;
  }

  addPlayer(playerId) {
    this.players.set(playerId, {
      id: playerId,
      name: playerId,
      letterCount: 0,
      isGameReady: false,
      isRoundReady: false,
      isConnected: true,
    });
    this.gamePlayerIds.push(playerId);
  }

  removePlayer(playerId) {
    // if player being removed is before the dealer idx, decrement so next dealer is the same idx
    if (
      this.gamePlayerIds.slice(0, this.gameDealerIdx + 1).includes(playerId)
    ) {
      this.gameDealerIdx -= 1;
    }

    this.players.delete(playerId);
    this.gamePlayerIds = this.gamePlayerIds.filter((id) => id !== playerId);

    if (this.gameState !== 'started') return;

    if (playerId === this.getPlayerTurnId()) {
      if (this.roundPlayerIds.at(-1) === playerId) {
        this.roundPlayerTurnIdx = 0;
      }

      this.takenCard = undefined;
      this.turnState = 'not_started';
    } else if (
      this.roundPlayerIds
        .slice(0, this.roundPlayerTurnIdx + 1)
        .includes(playerId)
    ) {
      this.roundPlayerTurnIdx -= 1;
    }

    this.roundPlayerIds = this.roundPlayerIds.filter((id) => id !== playerId);

    if (this.roundPlayerIds.length === 1) {
      this.gameState = 'finished';
      this.gameWinnerId = this.roundPlayerIds[0];
    }
  }

  connectPlayer(playerId) {
    this.players.get(playerId).isConnected = true;
    this.players.get(playerId).isGameReady = this.isGameStarted();
  }

  disconnectPlayer(playerId) {
    this.players.get(playerId).isConnected = false;
    this.players.get(playerId).isGameReady = false;
    this.players.get(playerId).isRoundReady = false;
  }

  isAnyPlayerConnected() {
    return [...this.players.values()].some((player) => player.isConnected);
  }

  togglePlayerGameReady(playerId) {
    this.players.get(playerId).isGameReady =
      !this.players.get(playerId).isGameReady;
  }

  togglePlayerRoundReady(playerId) {
    this.players.get(playerId).isRoundReady =
      !this.players.get(playerId).isRoundReady;
  }

  isEachPlayerGameReady() {
    return this.gamePlayerIds.every(
      (playerId) => this.players.get(playerId).isGameReady
    );
  }

  isEachPlayerRoundReady() {
    return this.roundPlayerIds.every(
      (playerId) => this.players.get(playerId).isRoundReady
    );
  }

  isGameStartable() {
    return this.gamePlayerIds.length > 1 && this.isEachPlayerGameReady();
  }

  isRoundStartable() {
    return this.roundState === 'cards_dealt' && this.isEachPlayerRoundReady();
  }

  resetGame() {
    this.gamePlayerIds.forEach((playerId) => {
      this.players.set(playerId, {
        ...this.players.get(playerId),
        letterCount: 0,
        cards: undefined,
        roundScore: undefined,
        isGameReady: false,
        isRoundReady: false,
      });
    });

    this.roundPlayerIds = [];

    this.gameState = 'not_started';
    this.roundState = 'not_started';
    this.turnState = 'not_started';

    this.gameDealerIdx = -1;

    this.drawPile = [];
    this.discardPile = [];
    this.takenCard = undefined;

    this.golfCallerId = undefined;
    this.gameWinnerId = undefined;
    this.roundLoserIds = undefined;
  }

  initializeGame() {
    this.gameState = 'started';

    shuffle(this.gamePlayerIds);
    this.roundPlayerIds = [...this.gamePlayerIds];

    this.initializeRound();
  }

  initializeRound() {
    this.incrementNextGameDealerIdx();

    // calculate the dealer idx for new array of remaining players
    this.roundPlayerIds.forEach((playerId, idx) => {
      if (this.gamePlayerIds[this.gameDealerIdx] === playerId) {
        this.roundPlayerTurnIdx = idx;
      }
    });

    this.gamePlayerIds.forEach((playerId) => {
      this.players.get(playerId).cards = undefined;
      this.players.get(playerId).roundScore = undefined;
      this.players.get(playerId).isRoundReady = false;
    });

    this.drawPile = getShuffledDeck(
      Math.floor((this.roundPlayerIds.length - 1) / 4) + 1
    );
    this.discardPile = [this.drawPile.pop()];

    this.roundPlayerIds.forEach((playerId) => {
      this.players.get(playerId).cards = this.drawPile.splice(-4);
    });

    this.golfCallerId = undefined;
    this.gameWinnerId = undefined;
    this.roundLoserIds = undefined;

    this.roundState = 'cards_dealt';
    this.turnState = 'not_started';
  }

  incrementNextGameDealerIdx() {
    do {
      this.gameDealerIdx = (this.gameDealerIdx + 1) % this.players.size;
    } while (this.isPlayerEliminated(this.gamePlayerIds[this.gameDealerIdx]));
  }

  incrementRoundPlayerTurnIdx() {
    this.roundPlayerTurnIdx =
      (this.roundPlayerTurnIdx + 1) % this.roundPlayerIds.length;
  }

  addToPlayerLetterCount(playerId: string, numLetters: number) {
    this.players.get(playerId).letterCount += numLetters;
  }

  isPlayerEliminated(playerId: string) {
    return this.players.get(playerId).letterCount >= this.gameWord.length;
  }

  eliminatePlayers() {
    this.roundPlayerIds = this.roundPlayerIds.filter(
      (playerId) => !this.isPlayerEliminated(playerId)
    );
  }

  calculateRoundResult() {
    this.roundState = 'finished';

    let highestScore = 0;
    this.roundLoserIds = [];

    this.roundPlayerIds.forEach((playerId) => {
      const playerScore = calculateScore(this.players.get(playerId).cards);
      this.players.get(playerId).roundScore = playerScore;

      if (playerScore > highestScore) {
        highestScore = playerScore;
        this.roundLoserIds = [playerId];
      } else if (playerScore === highestScore) {
        this.roundLoserIds.push(playerId);
      }
    });

    this.roundLoserIds.forEach((playerId) => {
      this.addToPlayerLetterCount(playerId, 1);
    });

    this.eliminatePlayers();

    if (this.roundPlayerIds.length === 1) {
      this.gameState = 'finished';
      this.gameWinnerId = this.roundPlayerIds[0];
    } else if (this.roundPlayerIds.length === 0) {
      // tie result: undo and replay round

      this.roundPlayerIds = [...this.roundLoserIds];

      this.roundLoserIds.forEach((playerId) => {
        this.addToPlayerLetterCount(playerId, -1);
      });

      this.roundLoserIds = undefined;
    }

    return {
      players: Object.fromEntries(this.players),
      roundLoserIds: this.roundLoserIds,
      gameWinnerId: this.gameWinnerId,
    };
  }
}

export default GolfGame;
