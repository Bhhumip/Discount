import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useEffect, useMemo } from "preact/hooks";

export default async () => {
  render(<App />, document.body);
};

function AppliesToProducts({
  onClickAdd,
  onClickRemove,
  value,
  // defaultValue,
  i18n,
  appliesTo,
  onAppliesToChange,
}) {
  return (
    <s-section>
      <s-box display="none">
        <s-text-field
          value={value.map(({ id }) => id).join(",")}
          label=""
          name="productsIds"
        //defaultValue={defaultValue.map(({ id }) => id).join(",")}
        />
      </s-box>
      <s-stack gap="base">
        <s-stack direction="inline" alignItems="end" gap="base">
          <s-select
            label={i18n.translate("products.appliesTo")}
            name="appliesTo"
            value={appliesTo}
            onChange={event =>
              onAppliesToChange(event.currentTarget.value)
            }
          >
            <s-option value="all">
              {i18n.translate("products.allProducts")}
            </s-option>
            <s-option value="products">
              {i18n.translate("products.specificProducts")}
            </s-option>
          </s-select>

          {appliesTo === "all" ? null : (
            <s-box inlineSize="180px">
              <s-button onClick={onClickAdd}>
                {i18n.translate("products.buttonLabel")}
              </s-button>
            </s-box>
          )}
        </s-stack>
        <ProductsSection products={value} onClickRemove={onClickRemove} />
      </s-stack>
    </s-section>
  );
}

function ProductsSection({
  products,
  onClickRemove,
}) {
  if (products.length === 0) {
    return null;
  }

  return products.map(product => (
    <s-stack
      direction="inline"
      alignItems="center"
      justifyContent="space-between"
      key={product.id}
    >
      <s-link
        href={`shopify://admin/products/${product.id.split("/").pop()}`}
        target="_blank"
      >
        {product.title}
      </s-link>
      <s-button variant="tertiary" onClick={() => onClickRemove(product.id)}>
        <s-icon type="x-circle" />
      </s-button>
    </s-stack>
  ));
}

function App() {
  const {
    applyExtensionMetafieldChange,
    i18n,
    initialPercentages,
    onPercentageValueChange,
    percentages,
    resetForm,
    initialProducts,
    products,
    appliesTo,
    onAppliesToChange,
    removeProduct,
    onSelectedProducts,
    loading,
  } = useExtensionData();

  const [error, setError] = useState();

  const { discounts } = shopify;
  const discountClassesSignalValue = discounts?.discountClasses?.value ?? [];

  const handleToggleDiscountClass = async (nextValue) => {
    const nextDiscountClasses = discountClassesSignalValue.includes(
      nextValue,
    )
      ? discountClassesSignalValue.filter((c) => c !== nextValue)
      : [...discountClassesSignalValue, nextValue];

    const result =
      await discounts?.updateDiscountClasses?.(nextDiscountClasses);

    if (!result.success) {
      setError(i18n.translate("error"));
    }

    if (result.success && error) {
      setError(undefined);
    }
  };

  if (loading) {
    return <s-text>{i18n.translate("loading")}</s-text>;
  }

  return (
    <s-function-settings
      onSubmit={event => {
        event.waitUntil?.(applyExtensionMetafieldChange());
      }}
      onReset={resetForm}
    >
      <s-heading>{i18n.translate("title")}</s-heading>
      <s-section>
        <s-stack gap="base">
          {error ? <s-banner tone="critical">{error}</s-banner> : null}
          <s-stack gap="none">
            <s-checkbox
              checked={discountClassesSignalValue.includes("product")}
              onChange={() => handleToggleDiscountClass("product")}
              label={i18n.translate("discountClasses.product")}
              disabled={
                discountClassesSignalValue.length === 1 &&
                discountClassesSignalValue.includes("product")
              }
            />

            {discountClassesSignalValue.includes("product") ? (
              <s-stack gap="none">
                <s-number-field
                  label={i18n.translate("label")}
                  name="product"
                  value={String(percentages.product)}
                  defaultValue={String(initialPercentages.product)}
                  min={0}
                  max={100}
                  onChange={event =>
                    onPercentageValueChange(
                      "product",
                      event.currentTarget.value,
                    )
                  }
                  suffix="%"
                />
                <AppliesToProducts
                  onClickAdd={onSelectedProducts}
                  onClickRemove={removeProduct}
                  value={products}
                  defaultValue={initialProducts}
                  i18n={i18n}
                  appliesTo={appliesTo}
                  onAppliesToChange={onAppliesToChange}
                />
              </s-stack>
            ) : null}
          </s-stack>

          <s-divider />

          <s-stack gap="none">
            <s-checkbox
              checked={discountClassesSignalValue.includes("order")}
              onChange={() => handleToggleDiscountClass("order")}
              label={i18n.translate("discountClasses.order")}
              disabled={
                discountClassesSignalValue.length === 1 &&
                discountClassesSignalValue.includes("order")
              }
            />

            {discountClassesSignalValue.includes("order") ? (
              <s-number-field
                label={i18n.translate("label")}
                name="order"
                value={String(percentages.order)}
                defaultValue={String(initialPercentages.order)}
                min={0}
                max={100}
                onChange={event =>
                  onPercentageValueChange("order", event.currentTarget.value)
                }
                suffix="%"
              />
            ) : null}
          </s-stack>

          <s-divider />

          <s-stack gap="none">
            <s-checkbox
              checked={discountClassesSignalValue.includes("shipping")}
              onChange={() => handleToggleDiscountClass("shipping")}
              label={i18n.translate("discountClasses.shipping")}
              disabled={
                discountClassesSignalValue.length === 1 &&
                discountClassesSignalValue.includes("shipping")
              }
            />

            {discountClassesSignalValue.includes("shipping") ? (
              <s-number-field
                label={i18n.translate("label")}
                name="shipping"
                value={String(percentages.shipping)}
                defaultValue={String(initialPercentages.shipping)}
                min={0}
                max={100}
                onChange={event =>
                  onPercentageValueChange("shipping", event.currentTarget.value)
                }
                suffix="%"
              />
            ) : null}
          </s-stack>
        </s-stack>
      </s-section>
    </s-function-settings>
  );
}

function useExtensionData() {
  const { applyMetafieldChange, i18n, data, resourcePicker, query } = shopify;

  const metafieldConfig = useMemo(
    () =>
      parseMetafield(
        data?.metafields?.find(
          metafield => metafield.key === "special-discount-configuration",
        )?.value,
      ),
    [data?.metafields],
  );

  const [percentages, setPercentages] = useState(metafieldConfig.percentages);
  const [initialProducts, setInitialProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [appliesTo, setAppliesTo] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const selectedProducts = await getProducts(
        metafieldConfig.productIds,
        query,
      );
      setInitialProducts(selectedProducts);
      setProducts(selectedProducts);
      setLoading(false);
      setAppliesTo(selectedProducts.length > 0 ? "products" : "all");
    };
    fetchProducts();
  }, [metafieldConfig.productIds, query]);

  const onPercentageValueChange = async (type, value) => {
    setPercentages(prev => ({
      ...prev,
      [type]: Number(value),
    }));
  };

  const onAppliesToChange = (value) => {
    setAppliesTo(value);
    if (value === "all") {
      setProducts([]);
    }
  };

  const applyExtensionMetafieldChange = async () => {
    await applyMetafieldChange({
      type: "updateMetafield",
      namespace: "custom",
      key: "special-discount-configuration",
      value: JSON.stringify({
        cartLinePercentage: percentages.product,
        orderPercentage: percentages.order,
        deliveryPercentage: percentages.shipping,
        productIds: products.map(({ id }) => id),
      }),
      valueType: "json",
      ownerId: shopify.data.discount.id
    });
    setInitialProducts(products);
  };

  const resetForm = () => {
    setPercentages(metafieldConfig.percentages);
    setProducts(initialProducts);
    setAppliesTo(initialProducts.length > 0 ? "products" : "all");
  };

  const onSelectedProducts = async () => {
    const selection = await resourcePicker({
      type: "product",
      selectionIds: products.map(({ id }) => ({ id })),
      action: "select",
      multiple: true,
    });
    setProducts(selection ?? []);
  };

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  return {
    applyExtensionMetafieldChange,
    i18n,
    initialPercentages: metafieldConfig.percentages,
    onPercentageValueChange,
    percentages,
    resetForm,
    products,
    initialProducts,
    removeProduct,
    onSelectedProducts,
    loading,
    appliesTo,
    onAppliesToChange,
  };
}

function parseMetafield(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return {
      percentages: {
        product: Number(parsed.cartLinePercentage ?? 0),
        order: Number(parsed.orderPercentage ?? 0),
        shipping: Number(parsed.deliveryPercentage ?? 0),
      },
      productIds: parsed.productIds ?? [],
    };
  } catch {
    return {
      percentages: { product: 0, order: 0, shipping: 0 },
      productIds: [],
    };
  }
}

async function getProducts(productGids, adminApiQuery) {
  if (!productGids || productGids.length === 0) {
    return [];
  }

  const query = `#graphql
    query GetProducts($ids: [ID!]!) {
      products: nodes(ids: $ids) {
        ... on Product {
          id
          title
        }
      }
    }
  `;

  const result = await adminApiQuery(query, {
    variables: { ids: productGids },
  });

  return result?.data?.products ?? [];
}