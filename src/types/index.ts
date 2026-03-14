// Global TypeScript type definitions shared across the application.

/** Represents an authenticated user in the system. */
export interface User {
  id: string;
  username: string;
  email: string;
  balance: number; // Current credit balance in USD
}

/** Represents a casino game displayed in the games catalog. */
export interface Game {
  id: string;
  name: string;
  description: string;
  minBet: number;       // Minimum bet amount in USD
  maxPlayers: number;   // Maximum number of concurrent players
  icon?: string;        // Text label used when no image is provided
  image?: string;       // Path to the game preview image
  gradient: string;     // CSS gradient key used for the card header background
  available: boolean;   // Whether the game is currently playable
}

/** Represents a payment method available in the recharge page. */
export interface RechargeMethod {
  id: string;
  name: string;
  icon: string;         // Text label displayed on the method card
  minAmount: number;    // Minimum recharge amount in USD
  maxAmount: number;    // Maximum recharge amount in USD
}
