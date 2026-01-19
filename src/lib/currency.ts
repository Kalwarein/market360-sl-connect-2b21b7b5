/**
 * Centralized currency formatting utilities for Sierra Leonean New Leone (NLE)
 * 
 * CURRENCY DENOMINATION RULES:
 * - The NEW LEONE (NLE) is the official currency (replaced old SLL on 2022-04-01)
 * - 1 NLE = 1,000 old Leones (SLL)
 * - All amounts in the system are stored as WHOLE NLE (integers)
 * - No decimals, no cents, no ×100 or ÷100 conversions in UI or ledger
 * - Display prefix: "Le" (e.g., "Le 10,000")
 * - ISO currency code: "SLE" (used in meta tags and APIs)
 * 
 * IMPORTANT: The Monime payment API uses cents (minor units), so we multiply by 100
 * when sending to Monime and divide by 100 when receiving from Monime webhooks.
 * This conversion happens ONLY in the edge functions, never in the frontend.
 */

/**
 * Format a number as NLE currency string
 * @param amount - Amount in whole NLE (integer)
 * @param options - Formatting options
 * @returns Formatted string like "Le 10,000"
 */
export function formatSLE(
  amount: number | null | undefined,
  options: {
    showSign?: boolean; // Show + or - prefix
    isCredit?: boolean; // Used with showSign to determine + or -
  } = {}
): string {
  const { showSign = false, isCredit = false } = options;
  const prefix = 'Le'; // Always use "Le" for display consistency
  
  // Handle null/undefined/NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${prefix} 0`;
  }
  
  // Ensure whole number (no decimals)
  const wholeAmount = Math.round(amount);
  
  // Format with comma separators, no decimals
  const formatted = Math.abs(wholeAmount).toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  
  // Build the result
  let result = `${prefix} ${formatted}`;
  
  if (showSign) {
    result = isCredit ? `+${result}` : `-${result}`;
  }
  
  return result;
}

/**
 * Parse a string input to whole Leones (integer)
 * Strips any non-numeric characters and returns whole number
 * @param input - User input string
 * @returns Whole number amount in Leones, or null if invalid
 */
export function parseSLE(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) {
    return null;
  }
  
  // If already a number, round to whole number
  if (typeof input === 'number') {
    return isNaN(input) ? null : Math.round(input);
  }
  
  // Remove all non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  
  if (!cleaned) {
    return null;
  }
  
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  // Return whole number only (no decimals)
  return Math.floor(parsed);
}

/**
 * Validate that an amount is a valid whole number for transactions
 * @param amount - Amount to validate
 * @param minAmount - Minimum allowed amount (default 1)
 * @returns Error message if invalid, null if valid
 */
export function validateSLEAmount(
  amount: number | null | undefined,
  minAmount: number = 1
): string | null {
  if (amount === null || amount === undefined) {
    return 'Please enter an amount';
  }
  
  if (isNaN(amount)) {
    return 'Invalid amount';
  }
  
  if (amount !== Math.floor(amount)) {
    return 'Only whole numbers are allowed (no decimals)';
  }
  
  if (amount < minAmount) {
    return `Minimum amount is Le ${minAmount.toLocaleString()}`;
  }
  
  return null;
}

/**
 * Format amount for display in wallet transactions
 * Handles credit/debit styling hints
 */
export function formatWalletAmount(
  amount: number,
  transactionType: string,
  status: string
): { text: string; isCredit: boolean; isNeutral: boolean } {
  const creditTypes = ['deposit', 'earning', 'refund'];
  const isCredit = creditTypes.includes(transactionType);
  const isSuccessful = status === 'success';
  
  // For failed withdrawals/payments, show as neutral (money wasn't actually deducted)
  const isNeutral = !isSuccessful && !isCredit;
  
  const text = formatSLE(amount, {
    showSign: !isNeutral,
    isCredit: isCredit && isSuccessful,
  });
  
  return { text, isCredit: isCredit && isSuccessful, isNeutral };
}
