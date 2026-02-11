import { DiscountClass } from "../generated/api";

function parseConfig(metafieldValue) {
  if (!metafieldValue) return { percentage: 0, productIds: [] };
  try {
    const parsed = JSON.parse(metafieldValue);
    return {
      // Align with UI key: cartLinePercentage
      percentage: Number(parsed.cartLinePercentage ?? 0),
      productIds: parsed.productIds || [],
    };
  } catch {
    return { percentage: 0, productIds: [] };
  }
}

export default function run(input) {
  const rawMetafield = input?.discount?.metafield?.value;
  if (!rawMetafield) return { operations: [] };

  // FIX: Call parseConfig directly, NOT JSON.parseConfig
  const config = parseConfig(rawMetafield);

  const targetLines = input.cart.lines.filter(line => {
    if (line.merchandise?.__typename !== 'ProductVariant') return false;
    const productId = line.merchandise.product.id;
    return config.productIds.includes(productId);
  });

  if (targetLines.length === 0 || config.percentage <= 0) return { operations: [] };

  return {
    operations: [{
      productDiscountsAdd: {
        candidates: [{
          message: `${config.percentage}% Off`,
          targets: targetLines.map(line => ({ cartLine: { id: line.id } })),
          value: { percentage: { value: config.percentage.toString() } },
        }],
      },
    }],
  };
}