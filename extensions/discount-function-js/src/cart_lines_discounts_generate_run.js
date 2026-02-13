// @ts-check
import { DiscountClass, ProductDiscountSelectionStrategy } from "../generated/api";
/** *
 * @typedef {Object} DiscountConfig
 * @property {number} cartLinePercentage
 * @property {number} percentage
 * @property {string[]} productIds
 * @property {boolean} [isLoyaltyDiscount]
 */

/**
 * @typedef {import("../generated/api").Input} Input
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * Discount function entrypoint
 * @param {Input} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export default function run(input) {

  const hasProductDiscountClass =
    input.discount?.discountClasses?.includes(DiscountClass.Product);
  if (!hasProductDiscountClass) {
    return { operations: [] };
  }
  const rawMetafield = input?.discount?.metafield?.value;
  if (!rawMetafield) {
    // No configuration → no discount
    return { operations: [] };
  }
  /** @type {{cartLinePercentage: number,  productIds: string[]}} */
  const config = parseConfig(rawMetafield);
  // Get discount code
  const discountCode = input.triggeringDiscountCode ?? "";
  const isLoyaltyDiscount = discountCode.endsWith("20");

  ;

  if (isLoyaltyDiscount) {
    // Handle the special "20" suffix logic
    return handleLoyaltyDiscount(input, config, discountCode);
  }

  // Original product discount logic
  if (
    !Array.isArray(config.productIds) ||
    !config.productIds.length ||
    !config.cartLinePercentage ||
    config.cartLinePercentage <= 0
  ) {
    return { operations: [] };
  }

  // Filter lines whose product IDs are in the configured list
  const targetLines = input.cart.lines.filter((line) => {
    if (line.merchandise?.__typename !== "ProductVariant") return false;
    const productId = line.merchandise.product?.id;
    if (!productId) return false;
    return config.productIds.includes(productId);
  });

  if (!targetLines.length) {
    return { operations: [] };
  }


  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: `${config.cartLinePercentage}% Off`,
              targets: targetLines.map((line) => ({
                cartLine: {
                  id: line.id,

                },
              })),
              value: {
                percentage: {
                  // Per schema -> Decimal-as-string, e.g. "10.0"
                  value: config.cartLinePercentage.toFixed(1),
                },
              },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}

/**
 * Handle discounts that end with "20" - special loyalty logic
 * @param {Input} input
 * @param {{cartLinePercentage: number,  productIds: string[]}} config
 * @param {string} discountCode
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
function handleLoyaltyDiscount(input, config, discountCode) {
  // Get customer order count
  const customer = input.cart.buyerIdentity?.customer;
  const orderCount = customer?.numberOfOrders || 0;
  const isNewCustomer = orderCount < 1;

  // Get all product variant lines 
  const targetLines = input.cart.lines.filter((line) => {
    return line.merchandise?.__typename === "ProductVariant";
  });

  if (!targetLines.length) {
    return { operations: [] };
  }

  // Determine discount percentage
  let discountPercentage = 0;


  if (!isNewCustomer) {
    return {
      operations: [
        {
          productDiscountsAdd: {
            candidates: [
              {
                message: "Code applied, no discount for returning customers, 2x loyalty points",
                targets: targetLines.map((line) => ({
                  cartLine: {
                    id: line.id,
                  },
                })),
                value: {
                  percentage: {
                    value: "0.0", // zero discount
                  },
                },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        },
      ],
    };


  } else {
    discountPercentage = config.cartLinePercentage || 0;
  }

  if (!discountPercentage || discountPercentage <= 0) {
    return { operations: [] };
  }

  const message = isNewCustomer
    ? `${discountPercentage}% Off`
    : "Code applied, no discount for returning customers,2x loyalty points";

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: message,
              targets: targetLines.map((line) => ({
                cartLine: {
                  id: line.id,
                },
              })),
              value: {
                percentage: {
                  value: String(discountPercentage.toFixed(1)),
                },
              },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}

/**
 * @param {string} metafieldValue
 * @returns {{cartLinePercentage: number, orderPercentage: number, deliveryPercentage: number, productIds: string[], collectionIds: string[]}}
 */
function parseConfig(metafieldValue) {
  if (!metafieldValue) return {
    cartLinePercentage: 0,
    orderPercentage: 0,
    deliveryPercentage: 0,
    productIds: [],
    collectionIds: []
  };

  try {
    const parsed = JSON.parse(metafieldValue);
    return {
      cartLinePercentage: parseFloat(parsed.cartLinePercentage ?? 0),
      orderPercentage: parseFloat(parsed.orderPercentage ?? 0),
      deliveryPercentage: parseFloat(parsed.deliveryPercentage ?? 0),
      productIds: parsed.productIds || [],
      collectionIds: parsed.collectionIds || [],
    };
  } catch (error) {
    return {
      cartLinePercentage: 0,
      orderPercentage: 0,
      deliveryPercentage: 0,
      productIds: [],
      collectionIds: []
    };
  }
}