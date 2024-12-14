
export function categorizeAmt(amount: number): string {
  const categories = ["sub10", "sub100", "sub500", "sub1000", "over1000"]
  if (amount < 10) return categories[0]!
  if (amount < 100) return categories[1]!
  if (amount < 500) return categories[2]!
  if (amount < 1000) return categories[3]!
  return categories[4]!
}