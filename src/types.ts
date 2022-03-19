const suits = ['♠', '♣', '♥', '♦'] as const;
type Suit = typeof suits[number];

const ranks = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;
type Rank = typeof ranks[number];

type Card = {
  suit: Suit;
  rank: Rank;
};

type PlayerCard = Card | 'facedown';

type Player = {
  id: string;
  name: string;
  letterCount: number;
  roundScore?: number;
  isGameReady: boolean;
  isRoundReady: boolean;
  isConnected: boolean;
};

type PlayerWithCards = Player & {
  cards?: Card[];
};

type PlayerWithPlayerCards = Player & {
  cards?: PlayerCard[];
};

type GameState = 'not_started' | 'started' | 'finished';

type RoundState = 'not_started' | 'cards_dealt' | 'started' | 'finished';

type TurnState = 'not_started' | 'card_taken' | 'card_discarded';

type GameProps = {
  player: PlayerWithPlayerCards;
  players: PlayerWithPlayerCards[];
  gameState: GameState;
  roundState: RoundState;
  turnState: TurnState;
  gameWord: string;
  playerTurnId?: string;
  discardPile: Card[];
  drawPileCardCount: number;
  takenCard?: Card;
  golfCallerId?: string;
  gameWinnerId?: string;
  roundLoserIds?: string[];
};

type ClientToServerEvents = {
  'create-game': (callback: (gameId: string) => void) => void;
  'join-game': (gameId: string, callback: (payload: GameProps) => void) => void;

  'start-game': (gameId: string) => void;

  'reset-game': (gameId: string) => void;
  'deal-new-round': (gameId: string) => void;

  'kick-player': (gameId: string, playerId: string) => void;

  'change-name': (gameId: string, username: string) => void;
  'change-game-word': (gameId: string, gameWord: string) => void;

  'toggle-game-ready': (
    gameId: string,
    callback: (isGameReady: boolean) => void
  ) => void;
  'toggle-round-ready': (
    gameId: string,
    callback: (isRoundReady: boolean) => void
  ) => void;

  'take-discard-pile': (gameId: string) => void;
  'take-draw-pile': (gameId: string, callback: (card: Card) => void) => void;
  'swap-card': (gameId: string, swapCardId: number) => void;
  'discard-card': (gameId: string) => void;

  'finish-turn': (gameId: string) => void;
  'call-golf': (gameId: string) => void;
};

type ServerToClientEvents = {
  'session-created': (payload: { sessionId: string; userId: string }) => void;
  error: (errorType: ErrorType) => void;

  'game-started': (payload: {
    gameId: string;
    player: PlayerWithPlayerCards;
    players: PlayerWithPlayerCards[];
  }) => void;
  'round-started': (payload: {
    discardPileTop: Card;
    playerTurnId: string;
    drawPileCardCount: number;
  }) => void;

  'game-reset': () => void;
  'round-reset': () => void;

  'cards-dealt': (payload: {
    gameId: string;
    cards: PlayerCard[];
    roundPlayerIds: string[];
  }) => void;
  'discard-pile-taken': (playerId: string) => void;
  'draw-pile-taken': (playerId: string) => void;
  'card-discarded': (payload: {
    playerId: string;
    discardedCard: Card;
  }) => void;
  'card-swapped': (payload: {
    playerId: string;
    discardedCard: Card;
    swapCardIdx: number;
  }) => void;

  'turn-finished': (playerTurnId?: string) => void;
  'round-finished': (payload: {
    players: { [playerId: string]: PlayerWithPlayerCards };
    roundLoserIds: string[];
    gameWinnerId: string;
  }) => void;
  'golf-called': (golfCallerId: string) => void;

  'game-word-changed': (gameWord: string) => void;

  'player-joined-game': (player: PlayerWithPlayerCards) => void;
  'player-rejoined-game': (playerId: string) => void;
  'player-disconnected': (playerId: string) => void;

  'player-left-game': (payload: {
    playerId: string;
    playerTurnId: string;
    turnState: TurnState;
  }) => void;

  'player-name-changed': (payload: { playerId: string; name: string }) => void;
  'player-game-ready-changed': (payload: {
    playerId: string;
    isGameReady: boolean;
  }) => void;
  'player-round-ready-changed': (payload: {
    playerId: string;
    isRoundReady: boolean;
  }) => void;
};

type InterServerEvents = {};

type SocketData = {
  sessionId?: string;
  userId?: string;
};

type ErrorType = 'game_not_found' | 'not_player_turn';

export { suits, ranks };
export type {
  Suit,
  Rank,
  Card,
  PlayerCard,
  Player,
  PlayerWithCards,
  PlayerWithPlayerCards,
  GameState,
  RoundState,
  TurnState,
  GameProps,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ErrorType,
};
