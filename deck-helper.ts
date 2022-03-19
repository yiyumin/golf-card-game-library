import { suits, ranks, Card, Rank } from './types';
import { shuffle } from './utils';

const createDeck = (): Card[] =>
  suits.flatMap((suit) => ranks.map((rank) => ({ suit, rank })));

const getShuffledDeck = (numberOfDecks: number = 1) => {
  const deck = createDeck();
  for (let i = 1; i < numberOfDecks; i++) {
    deck.push(...createDeck());
  }
  shuffle(deck);
  return deck;
};

const RANK_SCORE: Record<Rank, number> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 0,
  Q: 10,
  K: 10,
};

const calculateScore = (cards: Card[]) => {
  return cards
    .map(({ rank }) => RANK_SCORE[rank])
    .reduce((prev, curr) => prev + curr, 0);
};

export { createDeck, getShuffledDeck, calculateScore };
