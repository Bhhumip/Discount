/// extensions/discount-function/src/cart_delivery_options_discounts_generate_run.js

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export default function run(input) {
  const firstDeliveryGroup = input.cart.deliveryGroups?.[0];

  if (!firstDeliveryGroup) {
    return {
      discountApplicationStrategy: "FIRST",
      discounts: [],
    };
  }

  const discountMeta = input.discount.metafield;

  if (!discountMeta) {
    return {
      discountApplicationStrategy: "FIRST",
      discounts: [],
    };
  }

  let config;
  try {
    config = discountMeta.jsonValue;
  } catch (e) {
    return {
      discountApplicationStrategy: "FIRST",
      discounts: [],
    };
  }

  const deliveryPercentage = Number(config.deliveryPercentage || 0);
  const hasShippingDiscountClass = input.discount.discountClasses?.includes("SHIPPING");

  const discounts = [];

  if (hasShippingDiscountClass && deliveryPercentage > 0) {
    discounts.push({
      message: `${deliveryPercentage}% off shipping`,
      targets: [
        {
          deliveryGroup: {
            id: firstDeliveryGroup.id,
          },
        },
      ],
      value: {
        percentage: {
          value: deliveryPercentage.toString(),
        },
      },
    });
  }

  return {
    discountApplicationStrategy: "FIRST",
    discounts,
  };
}