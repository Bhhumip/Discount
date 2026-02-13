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
  i18n,
  appliesTo,
  onAppliesToChange,
}) {
  console.log("AppliesToProducts value:", value);
  return (
    <s-section>
      <s-box display="none">
        <s-text-field
          value={value.filter(Boolean).map(({ id }) => id).join(",")}
          label=""
          name="productsIds"
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
            <s-option value="collections">
              {i18n.translate("products.specificCollections")}
            </s-option>
          </s-select>

          {appliesTo === "all" ? null : (
            <s-box inlineSize="180px">
              <s-button onClick={onClickAdd}>
                {appliesTo === "collections"
                  ? i18n.translate("products.collectionsButtonLabel")
                  : i18n.translate("products.buttonLabel")}
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
    //isLoyaltyDiscount,
    // setIsLoyaltyDiscount,
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
  console.log("Metafield raw data:", data?.metafields);
  console.log("Parsed metafieldConfig:", metafieldConfig);

  const [percentages, setPercentages] = useState(metafieldConfig.percentages);
  const [initialProducts, setInitialProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [appliesTo, setAppliesTo] = useState("all");
  const [loading, setLoading] = useState(false);
  //const [isLoyaltyDiscount, setIsLoyaltyDiscount] = useState(metafieldConfig.isLoyaltyDiscount);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);

      // Check if we have productIds or collectionIds
      if (metafieldConfig.productIds && metafieldConfig.productIds.length > 0) {
        console.log("Fetching products for IDs:", metafieldConfig.productIds);
        const selectedProducts = await getProducts(
          metafieldConfig.productIds,
          query,
        );
        console.log("getProducts result:", selectedProducts);
        setInitialProducts(selectedProducts);
        setProducts(selectedProducts);
        setAppliesTo("products");
      } else if (metafieldConfig.collectionIds && metafieldConfig.collectionIds.length > 0) {
        console.log("Fetching collections for IDs:", metafieldConfig.collectionIds);
        const collectionProducts = await getProductsFromCollections(
          metafieldConfig.collectionIds,
          query,
        );
        console.log("Collection products result:", collectionProducts);
        setInitialProducts(collectionProducts);
        setProducts(collectionProducts);
        setCollections(metafieldConfig.collectionIds.map(id => ({ id })));
        setAppliesTo("collections");
      } else {
        setAppliesTo("all");
      }

      setLoading(false);
    };

    fetchResources();
  }, [metafieldConfig.productIds, metafieldConfig.collectionIds, query]);

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
      setCollections([]);
    } else if (value !== appliesTo) {
      // Switching between products and collections, clear both
      setProducts([]);
      setCollections([]);
    }
  };

  const applyExtensionMetafieldChange = async () => {
    const metafieldValue = {
      cartLinePercentage: percentages.product,
      orderPercentage: percentages.order,
      deliveryPercentage: percentages.shipping,
      //isLoyaltyDiscount: isLoyaltyDiscount,
    };

    // Save based on appliesTo mode
    if (appliesTo === "products") {
      metafieldValue.productIds = products.filter(Boolean).map(({ id }) => id);
      metafieldValue.collectionIds = [];
    } else if (appliesTo === "collections") {
      metafieldValue.collectionIds = collections.filter(Boolean).map(({ id }) => id);
      metafieldValue.productIds = [];
    } else {
      metafieldValue.productIds = [];
      metafieldValue.collectionIds = [];
    }

    await applyMetafieldChange({
      type: "updateMetafield",
      namespace: "custom",
      key: "special-discount-configuration",
      value: JSON.stringify(metafieldValue),
      valueType: "json",
    });

    setInitialProducts(products);
  };

  const resetForm = () => {
    setPercentages(metafieldConfig.percentages);
    setProducts(initialProducts);
    //setIsLoyaltyDiscount(metafieldConfig.isLoyaltyDiscount);

    if (metafieldConfig.collectionIds && metafieldConfig.collectionIds.length > 0) {
      setAppliesTo("collections");
    } else if (metafieldConfig.productIds && metafieldConfig.productIds.length > 0) {
      setAppliesTo("products");
    } else {
      setAppliesTo("all");
    }
  };

  const onSelectedProducts = async () => {
    // Fixed: Changed !== to ===
    if (appliesTo === "products") {
      const selection = await resourcePicker({
        type: "product",
        selectionIds: products.filter(Boolean).map(({ id }) => ({ id })),
        action: "select",
        multiple: true,
      });
      setProducts(selection ?? []);
    } else if (appliesTo === "collections") {
      const selection = await resourcePicker({
        type: "collection",
        selectionIds: collections.filter(Boolean).map(({ id }) => ({ id })),
        action: "select",
        multiple: true,
      });
      // Fixed: Removed extra semicolon and properly closed the function
      setCollections(selection ?? []);

      // Fetch all products from selected collections
      const allCollectionIds = (selection ?? []).map(({ id }) => id);
      const collectionProducts = await getProductsFromCollections(
        allCollectionIds,
        query,
      );
      setProducts((prev) => {
        const existingById = new Map(
          prev.filter(Boolean).map((p) => [p.id, p]),
        );
        for (const product of collectionProducts) {
          if (!existingById.has(product.id)) {
            existingById.set(product.id, product);
          }
        }
        return Array.from(existingById.values());
      });
    }
  };

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(product => product && product.id !== id));
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
    // isLoyaltyDiscount,
    //setIsLoyaltyDiscount,
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
      collectionIds: parsed.collectionIds ?? [],
      //isLoyaltyDiscount: parsed.isLoyaltyDiscount ?? false,
    };
  } catch {
    return {
      percentages: { product: 0, order: 0, shipping: 0 },
      productIds: [],
      collectionIds: [],
      //isLoyaltyDiscount: false,
    };
  }
}

// Helper function to fetch products by IDs
async function getProducts(productGids, adminApiQuery) {
  if (!productGids || productGids.length === 0) {
    console.log("getProducts called with empty productGids:", productGids);
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
  console.log("getProducts sending query with ids:", productGids);
  const result = await adminApiQuery(query, {
    variables: { ids: productGids },
  });
  console.log("getProducts raw result:", JSON.stringify(result, null, 2));

  const nodes = result?.data?.products ?? [];
  console.log("getProducts nodes array:", nodes);

  const filtered = nodes.filter((node) => node && node.id);
  console.log("getProducts filtered products:", filtered);

  return filtered;
}

// Helper function to fetch products from collections by collection IDs
async function getProductsFromCollections(collectionGids, adminApiQuery) {
  if (!collectionGids || collectionGids.length === 0) {
    return [];
  }

  const query = `#graphql
    query GetCollectionsProducts($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Collection {
          id
          title
          products(first: 250) {
            nodes {
              id
              title
            }
          }
        }
      }
    }
  `;

  const result = await adminApiQuery(query, {
    variables: { ids: collectionGids },
  });

  const nodes = result?.data?.nodes ?? [];

  const products = [];
  for (const node of nodes) {
    if (!node || !node.products) continue;
    for (const product of node.products.nodes || []) {
      if (product && product.id) {
        products.push(product);
      }
    }
  }

  return products;
}

