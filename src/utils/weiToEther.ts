export function weiToEther(wei: string): string {
  // Ensure at least 19 digits so slicing works
  const weiStr = wei.padStart(19, "0");

  const integerPart = weiStr.slice(0, -18) || "0";   // everything before last 18 digits
  const fractionalPart = weiStr.slice(-18).replace(/0+$/, ""); // trim trailing zeros

  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}