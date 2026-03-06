import IntlMessageFormat from 'intl-messageformat';

export type LocaleDirection = 'ltr' | 'rtl';

export interface TranslationBundle {
  locale: string;
  namespace: string;
  messages: Record<string, string>;
}

export interface BundleLoader {
  load(params: { tenantId?: string; locale: string; namespace: string }): Promise<TranslationBundle | null>;
}

export interface DynamicImportBundleLoaderOptions {
  importer: (params: { locale: string; namespace: string; tenantId?: string }) => Promise<
    | TranslationBundle
    | { messages: Record<string, string> }
    | { default: TranslationBundle | { messages: Record<string, string> } }
  >;
}

export interface BundleCache {
  get(key: string): TranslationBundle | undefined;
  set(key: string, value: TranslationBundle, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
}

export interface I18nProvider {
  locale: string;
  direction: LocaleDirection;
  themeTokens: Record<string, string | number>;
  t(key: string, params?: Record<string, unknown>, options?: TranslateOptions): string;
  has(key: string, options?: TranslateOptions): boolean;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatDate(value: Date, options?: Intl.DateTimeFormatOptions): string;
}

export interface TranslateOptions {
  namespace?: string;
  defaultText?: string;
}

export interface CreateI18nProviderOptions {
  locale: string;
  tenantId?: string;
  namespaces: string[];
  platformBundles?: TranslationBundle[];
  tenantBundleLoader?: BundleLoader;
  cache?: BundleCache;
  fallbackLocale?: string;
  fallbackLocales?: string[];
  mode?: 'dev' | 'prod';
  machineTranslation?: MachineTranslationOptions;
  localeThemes?: LocaleThemeConfig;
}

export interface MachineTranslationProvider {
  translate(params: { text: string; fromLocale: string; toLocale: string; namespace: string; key: string }): Promise<string>;
}

export interface MachineTranslationOptions {
  enabled?: boolean;
  envs?: Array<'development' | 'staging' | 'test' | 'production'>;
  provider: MachineTranslationProvider;
}

export interface LocaleThemeConfig {
  base?: Record<string, string | number>;
  byLocale?: Record<string, Record<string, string | number>>;
  fallbackLocale?: string;
}

export function resolveLocalizedTheme(
  locale: string,
  config?: LocaleThemeConfig,
): Record<string, string | number> {
  return resolveLocaleThemeTokens(config, locale);
}

export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export const PLATFORM_BUNDLES: TranslationBundle[] = [
  {
    locale: 'en',
    namespace: 'runtime',
    messages: {
      'filters.customerName.label': 'Customer name',
      'filters.customerName.placeholder': 'Search by name',
      'filters.customerName.helper': 'Use at least 2 characters',
      'filters.customerName.aria': 'Customer name filter',
      'filters.orderTotal.label': 'Order total',
      'filters.orderTotal.placeholder': 'Enter order total',
      'filters.orderTotal.helper': 'Use a number',
      'filters.orderTotal.aria': 'Order total filter',
      'orders.table.label': 'Orders',
      'orders.table.aria': 'Orders table',
      'orders.table.columns.orderId': 'Order',
      'orders.table.columns.customer': 'Customer',
      'orders.table.columns.total': 'Total',
      'revenue.chart.label': 'Revenue trend',
      'revenue.chart.aria': 'Revenue chart',
      'customViz.label': 'Custom visualization',
      'customViz.aria': 'Custom visualization',
      'company.orderTotal.label': 'Order total',
      'company.orderTotal.aria': 'Order total input',
      'company.loanAmount.label': 'Loan amount',
      'company.loanAmount.aria': 'Loan amount input',
      'company.riskBadge.label': 'Risk',
      'company.riskBadge.aria': 'Risk level badge',
    },
  },
  {
    locale: 'de',
    namespace: 'runtime',
    messages: {
      'filters.customerName.label': 'Kundenname',
      'filters.customerName.placeholder': 'Nach Namen suchen',
      'filters.customerName.helper': 'Mindestens 2 Zeichen verwenden',
      'filters.customerName.aria': 'Filter Kundenname',
      'filters.orderTotal.label': 'Bestellsumme',
      'filters.orderTotal.placeholder': 'Bestellsumme eingeben',
      'filters.orderTotal.helper': 'Zahl eingeben',
      'filters.orderTotal.aria': 'Filter Bestellsumme',
      'orders.table.label': 'Bestellungen',
      'orders.table.aria': 'Bestellungstabelle',
      'orders.table.columns.orderId': 'Bestellung',
      'orders.table.columns.customer': 'Kunde',
      'orders.table.columns.total': 'Summe',
      'revenue.chart.label': 'Umsatztrend',
      'revenue.chart.aria': 'Umsatzdiagramm',
      'customViz.label': 'Benutzerdefinierte Visualisierung',
      'customViz.aria': 'Benutzerdefinierte Visualisierung',
    },
  },
  {
    locale: 'fr',
    namespace: 'runtime',
    messages: {
      'filters.customerName.label': 'Nom du client',
      'filters.customerName.placeholder': 'Rechercher par nom',
      'filters.customerName.helper': 'Utilisez au moins 2 caractères',
      'filters.customerName.aria': 'Filtre nom du client',
      'filters.orderTotal.label': 'Total de commande',
      'filters.orderTotal.placeholder': 'Saisir le total',
      'filters.orderTotal.helper': 'Utilisez un nombre',
      'filters.orderTotal.aria': 'Filtre total de commande',
      'orders.table.label': 'Commandes',
      'orders.table.aria': 'Tableau des commandes',
      'orders.table.columns.orderId': 'Commande',
      'orders.table.columns.customer': 'Client',
      'orders.table.columns.total': 'Total',
      'revenue.chart.label': 'Tendance des revenus',
      'revenue.chart.aria': 'Graphique des revenus',
      'customViz.label': 'Visualisation personnalisée',
      'customViz.aria': 'Visualisation personnalisée',
    },
  },
  {
    locale: 'hi',
    namespace: 'runtime',
    messages: {
      'filters.customerName.label': 'ग्राहक नाम',
      'filters.customerName.placeholder': 'नाम से खोजें',
      'filters.customerName.helper': 'कम से कम 2 अक्षर उपयोग करें',
      'filters.customerName.aria': 'ग्राहक नाम फ़िल्टर',
      'filters.orderTotal.label': 'ऑर्डर कुल',
      'filters.orderTotal.placeholder': 'ऑर्डर कुल दर्ज करें',
      'filters.orderTotal.helper': 'एक संख्या उपयोग करें',
      'filters.orderTotal.aria': 'ऑर्डर कुल फ़िल्टर',
      'orders.table.label': 'ऑर्डर',
      'orders.table.aria': 'ऑर्डर तालिका',
      'orders.table.columns.orderId': 'ऑर्डर',
      'orders.table.columns.customer': 'ग्राहक',
      'orders.table.columns.total': 'कुल',
      'revenue.chart.label': 'राजस्व प्रवृत्ति',
      'revenue.chart.aria': 'राजस्व चार्ट',
      'customViz.label': 'कस्टम विज़ुअलाइज़ेशन',
      'customViz.aria': 'कस्टम विज़ुअलाइज़ेशन',
    },
  },
];

/**
 * Translation bundles for the curated example demos (E-Commerce, Onboarding, SaaS Dashboard).
 * These are exported separately so consuming code can opt-in without inflating the core runtime bundle.
 */
export const EXAMPLE_DEMO_BUNDLES: TranslationBundle[] = [
  /* ── E-Commerce Store Demo (namespace: ecr) ────────────────── */
  {
    locale: 'en',
    namespace: 'ecr',
    messages: {
      // Home page
      'home.hero.title': 'Welcome to ECR Commerce',
      'home.hero.aria': 'Welcome banner for the e-commerce store',
      'home.category.electronics.aria': 'Browse Electronics category',
      'home.category.clothing.aria': 'Browse Clothing category',
      'home.category.home.aria': 'Browse Home & Garden category',
      'home.featured.table': 'Featured Products',
      'home.featured.table.aria': 'Featured products table',
      // Product page
      'product.name': 'Product Name',
      'product.name.aria': 'Product name heading',
      'product.price': 'Price',
      'product.price.aria': 'Product price',
      'product.description': 'Description',
      'product.description.aria': 'Product description',
      'product.stock': 'In Stock',
      'product.stock.aria': 'Product stock status',
      'product.addToCart': 'Add to Cart',
      'product.addToCart.aria': 'Add this product to your cart',
      // Cart page
      'cart.items.table': 'Cart Items',
      'cart.items.table.aria': 'Shopping cart items table',
      'cart.total': 'Cart Total',
      'cart.total.aria': 'Total amount in your cart',
      'cart.discount.label': 'Discount Code',
      'cart.discount.placeholder': 'Enter discount code',
      'cart.discount.helper': 'Enter a valid code to apply savings',
      'cart.discount.aria': 'Discount code input field',
      'cart.applyDiscount': 'Apply Discount',
      'cart.applyDiscount.aria': 'Apply discount code',
      'cart.checkout': 'Proceed to Checkout',
      'cart.checkout.aria': 'Proceed to checkout',
      // Checkout page
      'checkout.shipping.address.label': 'Street Address',
      'checkout.shipping.address.placeholder': '123 Main Street',
      'checkout.shipping.address.aria': 'Shipping street address',
      'checkout.shipping.city.label': 'City',
      'checkout.shipping.city.placeholder': 'San Francisco',
      'checkout.shipping.city.aria': 'Shipping city',
      'checkout.shipping.postalCode.label': 'Postal Code',
      'checkout.shipping.postalCode.placeholder': '94103',
      'checkout.shipping.postalCode.aria': 'Postal code',
      'checkout.payment.method.label': 'Payment Method',
      'checkout.payment.method.placeholder': 'Select payment method',
      'checkout.payment.method.aria': 'Payment method selector',
      'checkout.placeOrder': 'Place Order',
      'checkout.placeOrder.aria': 'Place your order',
      // Confirmation page
      'confirmation.reference': 'Order Confirmed',
      'confirmation.reference.aria': 'Order confirmation reference',
      'confirmation.summary.table': 'Order Summary',
      'confirmation.summary.table.aria': 'Order summary table',
      'confirmation.continueShopping': 'Continue Shopping',
      'confirmation.continueShopping.aria': 'Return to store',
      // Table column headers
      'products.name': 'Product',
      'products.price': 'Price',
      'products.category': 'Category',
      'products.rating': 'Rating',
      'cart.item.name': 'Item',
      'cart.item.quantity': 'Qty',
      'cart.item.unitPrice': 'Unit Price',
      'cart.item.subtotal': 'Subtotal',
      'confirmation.item': 'Item',
      'confirmation.quantity': 'Qty',
      'confirmation.price': 'Price',
      'confirmation.subtotal': 'Subtotal',
    },
  },
  /* ── Onboarding Journey (namespace: onboarding) ────────────── */
  {
    locale: 'en',
    namespace: 'onboarding',
    messages: {
      // Welcome page
      'welcome.title': 'Welcome to ECR Platform',
      'welcome.title.aria': 'Welcome heading',
      'welcome.subtitle': "Let's set up your workspace in a few simple steps",
      'welcome.subtitle.aria': 'Getting started subtitle',
      'feature.ruleEngine.aria': 'Rule Engine feature — build and deploy business rules',
      'feature.flowDesigner.aria': 'Flow Designer feature — create multi-step workflows',
      'feature.analytics.aria': 'Analytics Dashboard feature — monitor performance',
      'getStarted.aria': 'Get Started button',
      // Account setup page
      'accountSection.aria': 'Account details section',
      'accountName.label': 'Full Name',
      'accountName.placeholder': 'Jordan Sales',
      'accountName.aria': 'Full name input',
      'accountEmail.label': 'Email Address',
      'accountEmail.placeholder': 'jordan@enterprise.com',
      'accountEmail.aria': 'Email address input',
      'accountOrg.label': 'Organization',
      'accountOrg.placeholder': 'Acme Corp',
      'accountOrg.aria': 'Organization name input',
      'accountBack.aria': 'Go back',
      'accountNext.aria': 'Continue to next step',
      // Preferences page
      'preferencesSection.aria': 'Configure preferences',
      'preferenceTier.aria': 'Subscription tier selector',
      'preferenceRegion.aria': 'Region selector',
      'preferenceNotifications.aria': 'Notification preference selector',
      'preferencesBack.aria': 'Go back to account details',
      'preferencesNext.aria': 'Continue to finish',
      // Finish page
      'finish.title.aria': 'Setup complete',
      'finish.summary.aria': 'Your account has been configured',
      'finish.table.label': 'Account Summary',
      'finish.table.aria': 'Account summary table',
      'finish.table.field': 'Field',
      'finish.table.value': 'Value',
      'finish.openDashboard.aria': 'Open dashboard',
      'finish.reviewSettings.aria': 'Review settings',
    },
  },
  /* ── SaaS Dashboard + Ecommerce extras (namespace: examples) ── */
  {
    locale: 'en',
    namespace: 'examples',
    messages: {
      // SaaS login
      'saas.appTitle.aria': 'SaaS Insights Platform',
      'saas.login.username': 'Username',
      'saas.login.username.placeholder': 'Enter your username',
      'saas.login.username.aria': 'Username input',
      'saas.login.password': 'Password',
      'saas.login.password.placeholder': 'Enter your password',
      'saas.login.password.aria': 'Password input',
      'saas.login.submit.aria': 'Sign In',
      // SaaS dashboard
      'saas.dashboard.welcome.aria': 'Dashboard welcome message',
      'saas.dashboard.kpi.revenue.aria': 'Revenue KPI card',
      'saas.dashboard.kpi.activeUsers.aria': 'Active users KPI card',
      'saas.dashboard.kpi.csat.aria': 'Customer satisfaction KPI card',
      'saas.dashboard.chart.revenue.label': 'Revenue Over Time',
      'saas.dashboard.chart.revenue.aria': 'Revenue trend chart',
      'saas.dashboard.reports.label': 'Recent Reports',
      'saas.dashboard.reports.aria': 'Recent reports table',
      'saas.dashboard.reports.name': 'Report',
      'saas.dashboard.reports.status': 'Status',
      'saas.dashboard.reports.owner': 'Owner',
      'saas.dashboard.reports.date': 'Date',
      'saas.dashboard.viewReports.aria': 'View all reports',
      // SaaS reports
      'saas.reports.title.aria': 'Reports',
      'saas.reports.table.label': 'All Reports',
      'saas.reports.table.aria': 'Reports data table',
      'saas.reports.name': 'Report',
      'saas.reports.status': 'Status',
      'saas.reports.owner': 'Owner',
      'saas.reports.region.name': 'Region',
      'saas.reports.region.revenue': 'Revenue',
      'saas.reports.region.growth': 'Growth',
      'saas.reports.regionRevenue.label': 'Revenue by Region',
      'saas.reports.regionRevenue.aria': 'Regional revenue table',
      'saas.reports.export.aria': 'Export report',
      'saas.reports.back.aria': 'Back to dashboard',
      // Ecommerce extras (used in ecommerce.json)
      'home.hero': 'Welcome to Our Store',
      'home.hero.aria': 'E-commerce store hero banner',
      'categories.table': 'Product Categories',
      'categories.table.aria': 'Product categories table',
      'categories.name': 'Category',
      'categories.items': 'Items',
      'categories.description': 'Description',
      'products.table': 'Featured Products',
      'products.table.aria': 'Featured products table',
      'products.name': 'Product',
      'products.price': 'Price',
      'products.stock': 'Stock',
      'products.category': 'Category',
      'category.filters.aria': 'Category filters',
      'category.products.aria': 'Category products table',
      'product.carousel.aria': 'Product image carousel',
      'product.specs.aria': 'Product specifications',
      'cart.table.aria': 'Shopping cart table',
      'cart.totals.aria': 'Cart totals summary',
      'cart.item': 'Item',
      'cart.qty': 'Qty',
      'cart.price': 'Price',
      'checkout.address.aria': 'Shipping address',
      'checkout.city.aria': 'City',
      'checkout.postal.aria': 'Postal code',
      'checkout.country.aria': 'Country',
      'confirmation.message.aria': 'Order confirmation',
      'confirmation.summary.aria': 'Order summary table',
      'confirmation.label': 'Label',
      'confirmation.value': 'Value',
      'admin.chart.aria': 'Admin revenue chart',
      'admin.regionTable.aria': 'Regional breakdown table',
      'metrics.region': 'Region',
      'metrics.revenue': 'Revenue',
    },
  },
];

export const EXAMPLE_TENANT_BUNDLES: TranslationBundle[] = [
  {
    locale: 'ar',
    namespace: 'runtime',
    messages: {
      'filters.customerName.label': 'اسم العميل',
      'filters.customerName.placeholder': 'ابحث بالاسم',
      'filters.customerName.helper': 'استخدم حرفين على الأقل',
      'filters.customerName.aria': 'مرشح اسم العميل',
      'filters.orderTotal.label': 'إجمالي الطلب',
      'filters.orderTotal.placeholder': 'أدخل إجمالي الطلب',
      'filters.orderTotal.helper': 'استخدم رقمًا',
      'filters.orderTotal.aria': 'مرشح إجمالي الطلب',
      'orders.table.label': 'الطلبات',
      'orders.table.aria': 'جدول الطلبات',
      'orders.table.columns.orderId': 'طلب',
      'orders.table.columns.customer': 'عميل',
      'orders.table.columns.total': 'الإجمالي',
      'revenue.chart.label': 'اتجاه الإيرادات',
      'revenue.chart.aria': 'مخطط الإيرادات',
      'customViz.label': 'تصور مخصص',
      'customViz.aria': 'تصور مخصص',
    },
  },
];

export async function createI18nProvider(options: CreateI18nProviderOptions): Promise<I18nProvider> {
  const platformBundles = options.platformBundles ?? PLATFORM_BUNDLES;
  const resolvedBundles: TranslationBundle[] = [...platformBundles];
  const localeChain = buildLocaleFallbackChain(
    options.locale,
    options.fallbackLocale,
    options.fallbackLocales,
  );

  if (options.tenantBundleLoader) {
    const cache = options.cache ?? createMemoryCache();
    for (const namespace of options.namespaces) {
      for (const locale of localeChain) {
        const cacheKey = buildCacheKey(options.tenantId, locale, namespace);
        let bundle = cache.get(cacheKey);
        if (!bundle) {
          const loaded = await options.tenantBundleLoader.load({
            tenantId: options.tenantId,
            locale,
            namespace,
          });
          if (loaded) {
            cache.set(cacheKey, loaded);
            bundle = loaded;
          }
        }
        if (bundle) resolvedBundles.push(bundle);
      }
    }
  }

  const machineTranslationEnabled = shouldEnableMachineTranslation(options.machineTranslation);
  if (machineTranslationEnabled && options.machineTranslation) {
    await prefillMissingMessagesWithMachineTranslation(
      resolvedBundles,
      options.namespaces,
      localeChain,
      options.machineTranslation.provider,
    );
  }

  return createProviderFromBundles({
    locale: options.locale,
    bundles: resolvedBundles,
    fallbackLocale: options.fallbackLocale,
    fallbackLocales: options.fallbackLocales,
    mode: options.mode ?? 'prod',
    localeThemes: options.localeThemes,
  });
}

export function createProviderFromBundles(options: {
  locale: string;
  bundles: TranslationBundle[];
  fallbackLocale?: string;
  fallbackLocales?: string[];
  mode?: 'dev' | 'prod';
  localeThemes?: LocaleThemeConfig;
}): I18nProvider {
  const mode = options.mode ?? 'prod';
  const bundleIndex = indexBundles(options.bundles);
  const localeChain = buildLocaleFallbackChain(options.locale, options.fallbackLocale, options.fallbackLocales);
  const themeTokens = resolveLocaleThemeTokens(options.localeThemes, options.locale);

  return {
    locale: options.locale,
    direction: resolveDirection(options.locale),
    themeTokens,
    t: (key, params, translateOptions) => {
      const { namespace, entryKey } = resolveKey(key, translateOptions);
      const message = resolveMessage(bundleIndex, localeChain, namespace, entryKey);
      if (!message) {
        if (mode === 'dev') return key;
        return translateOptions?.defaultText ?? '';
      }
      return formatMessage(message, options.locale, params);
    },
    has: (key, translateOptions) => {
      const { namespace, entryKey } = resolveKey(key, translateOptions);
      return !!resolveMessage(bundleIndex, localeChain, namespace, entryKey);
    },
    formatNumber: (value, formatOptions) =>
      new Intl.NumberFormat(options.locale, formatOptions).format(value),
    formatDate: (value, formatOptions) =>
      new Intl.DateTimeFormat(options.locale, formatOptions).format(value),
  };
}

export function createFallbackI18nProvider(locale = 'en'): I18nProvider {
  return {
    locale,
    direction: resolveDirection(locale),
    themeTokens: {},
    t: (key, _params, options) => options?.defaultText ?? key,
    has: () => true,
    formatNumber: (value, formatOptions) => new Intl.NumberFormat(locale, formatOptions).format(value),
    formatDate: (value, formatOptions) => new Intl.DateTimeFormat(locale, formatOptions).format(value),
  };
}

export function createMemoryCache(defaultTtlMs = 5 * 60 * 1000): BundleCache {
  const store = new Map<string, { value: TranslationBundle; expiresAt: number | null }>();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttlMs = defaultTtlMs) {
      store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
    },
    delete(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

export function createMockTenantLoader(bundles: TranslationBundle[]): BundleLoader {
  return {
    async load(params) {
      return (
        bundles.find(
          (bundle) =>
            bundle.locale === params.locale &&
            bundle.namespace === params.namespace,
        ) ?? null
      );
    },
  };
}

export function createHttpBundleLoader(options: {
  baseUrl: string;
  fetchFn?: typeof fetch;
}): BundleLoader {
  const fetcher = options.fetchFn ?? fetch;
  return {
    async load(params) {
      if (!params.tenantId) return null;
      const url = `${options.baseUrl}/${params.tenantId}/${params.locale}/${params.namespace}.json`;
      const response = await fetcher(url);
      if (!response.ok) return null;
      const messages = (await response.json()) as Record<string, string>;
      return { locale: params.locale, namespace: params.namespace, messages };
    },
  };
}

export function createDynamicImportBundleLoader(
  options: DynamicImportBundleLoaderOptions,
): BundleLoader {
  return {
    async load(params) {
      try {
        const loaded = await options.importer(params);
        const normalized = normalizeDynamicBundlePayload(loaded);
        if (!normalized) return null;
        return {
          locale: params.locale,
          namespace: params.namespace,
          messages: normalized.messages,
        };
      } catch {
        return null;
      }
    },
  };
}

export function createDevelopmentMachineTranslator(
  translateFn?: (params: { text: string; fromLocale: string; toLocale: string }) => Promise<string>,
): MachineTranslationProvider {
  return {
    async translate(params) {
      if (translateFn) return translateFn(params);
      return `[MT ${params.toLocale}] ${params.text}`;
    },
  };
}

export interface LocaleResolverInput {
  tenantLocale?: string | null;
  userLocale?: string | null;
  fallbackLocale?: string;
  supportedLocales?: string[];
}

export function resolveLocale(input: LocaleResolverInput): string {
  const fallbackLocale = normalizeLocale(input.fallbackLocale) ?? 'en';
  const supported = (input.supportedLocales ?? []).map((locale) => normalizeLocale(locale)).filter(Boolean) as string[];

  const preferred = [
    normalizeLocale(input.userLocale),
    normalizeLocale(input.tenantLocale),
    fallbackLocale,
  ].filter(Boolean) as string[];

  if (supported.length === 0) {
    return preferred[0] ?? fallbackLocale;
  }

  for (const candidate of preferred) {
    if (supported.includes(candidate)) return candidate;
    const language = candidate.split('-')[0];
    if (language) {
      const languageMatch = supported.find((locale) => locale === language || locale.startsWith(`${language}-`));
      if (languageMatch) return languageMatch;
    }
  }
  return fallbackLocale;
}

export function listBundleLocales(bundles: TranslationBundle[]): string[] {
  const locales = bundles
    .map((bundle) => normalizeLocale(bundle.locale))
    .filter((locale): locale is string => typeof locale === 'string');
  return Array.from(new Set(locales)).sort((a, b) => a.localeCompare(b));
}

export function upsertBundleMessage(
  bundles: TranslationBundle[],
  payload: { locale: string; namespace: string; key: string; value: string },
): TranslationBundle[] {
  const locale = normalizeLocale(payload.locale) ?? payload.locale;
  const namespace = payload.namespace.trim() || 'runtime';
  const key = payload.key.trim();
  const value = payload.value;
  if (!key) return bundles;

  const next = bundles.map((bundle) => ({
    ...bundle,
    messages: { ...bundle.messages },
  }));

  const existing = next.find((bundle) => bundle.locale === locale && bundle.namespace === namespace);
  if (existing) {
    existing.messages[key] = value;
    return next;
  }

  next.push({
    locale,
    namespace,
    messages: {
      [key]: value,
    },
  });
  return next;
}

function normalizeLocale(locale: string | null | undefined): string | null {
  if (!locale) return null;
  const trimmed = locale.trim();
  if (!trimmed) return null;
  return trimmed;
}

function buildCacheKey(tenantId: string | undefined, locale: string, namespace: string): string {
  return `${tenantId ?? 'platform'}:${locale}:${namespace}`;
}

function resolveDirection(locale: string): LocaleDirection {
  const normalized = locale.toLowerCase();
  return RTL_LOCALES.some((rtl) => normalized.startsWith(rtl)) ? 'rtl' : 'ltr';
}

type BundleIndex = Map<string, Map<string, TranslationBundle[]>>;

function indexBundles(bundles: TranslationBundle[]): BundleIndex {
  const index: BundleIndex = new Map();
  for (const bundle of bundles) {
    const byLocale = index.get(bundle.locale) ?? new Map<string, TranslationBundle[]>();
    const byNamespace = byLocale.get(bundle.namespace) ?? [];
    byNamespace.push(bundle);
    byLocale.set(bundle.namespace, byNamespace);
    index.set(bundle.locale, byLocale);
  }
  return index;
}

function resolveKey(key: string, options?: TranslateOptions): { namespace: string; entryKey: string } {
  if (options?.namespace) {
    return { namespace: options.namespace, entryKey: key };
  }
  if (key.includes(':')) {
    const [namespace, entryKey] = key.split(':', 2);
    return { namespace: namespace || 'runtime', entryKey: entryKey ?? key };
  }
  if (key.includes('.')) {
    const [namespace, ...rest] = key.split('.');
    const entryKey = rest.length > 0 ? rest.join('.') : key;
    return { namespace: namespace || 'runtime', entryKey };
  }
  return { namespace: 'runtime', entryKey: key };
}

function resolveMessage(
  index: BundleIndex,
  localeChain: string[],
  namespace: string,
  entryKey: string,
): string | undefined {
  for (const locale of localeChain) {
    const local = lookupMessage(index, locale, namespace, entryKey);
    if (local !== undefined) return local;
  }
  return undefined;
}

function lookupMessage(index: BundleIndex, locale: string, namespace: string, entryKey: string): string | undefined {
  const byLocale = index.get(locale);
  if (!byLocale) return undefined;
  const bundles = byLocale.get(namespace);
  if (!bundles) return undefined;
  for (const bundle of bundles) {
    const message = bundle.messages[entryKey];
    if (message !== undefined) return message;
  }
  return undefined;
}

function buildLocaleFallbackChain(
  locale: string,
  fallbackLocale?: string,
  fallbackLocales?: string[],
): string[] {
  const chain: string[] = [];
  const pushLocale = (value: string | undefined) => {
    const normalized = normalizeLocale(value);
    if (!normalized || chain.includes(normalized)) return;
    chain.push(normalized);
  };

  pushLocale(locale);
  const language = normalizeLocale(locale)?.split('-')[0];
  if (language) pushLocale(language);
  for (const fallback of fallbackLocales ?? []) pushLocale(fallback);
  pushLocale(fallbackLocale);
  if (chain.length === 0) pushLocale('en');
  return chain;
}

function resolveLocaleThemeTokens(config: LocaleThemeConfig | undefined, locale: string): Record<string, string | number> {
  if (!config) return {};
  const base = { ...(config.base ?? {}) };
  const localeChain = buildLocaleFallbackChain(locale, config.fallbackLocale, []);
  for (const candidate of localeChain) {
    const overrides = config.byLocale?.[candidate];
    if (!overrides) continue;
    Object.assign(base, overrides);
  }
  return base;
}

async function prefillMissingMessagesWithMachineTranslation(
  bundles: TranslationBundle[],
  namespaces: string[],
  localeChain: string[],
  provider: MachineTranslationProvider,
): Promise<void> {
  if (localeChain.length === 0) return;
  const targetLocale = localeChain[0] ?? 'en';
  const sourceLocale = localeChain.find((locale) => locale !== targetLocale) ?? 'en';

  for (const namespace of namespaces) {
    const targetBundle = ensureBundle(bundles, targetLocale, namespace);
    const sourceBundle = findBundle(bundles, sourceLocale, namespace) ?? findBundle(bundles, 'en', namespace);
    if (!sourceBundle) continue;
    for (const [key, text] of Object.entries(sourceBundle.messages)) {
      if (targetBundle.messages[key] !== undefined) continue;
      targetBundle.messages[key] = await provider.translate({
        text,
        fromLocale: sourceBundle.locale,
        toLocale: targetLocale,
        namespace,
        key,
      });
    }
  }
}

function ensureBundle(bundles: TranslationBundle[], locale: string, namespace: string): TranslationBundle {
  const existing = findBundle(bundles, locale, namespace);
  if (existing) return existing;
  const created: TranslationBundle = { locale, namespace, messages: {} };
  bundles.push(created);
  return created;
}

function findBundle(bundles: TranslationBundle[], locale: string, namespace: string): TranslationBundle | undefined {
  return bundles.find((bundle) => bundle.locale === locale && bundle.namespace === namespace);
}

function readProcessEnv(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
}

function shouldEnableMachineTranslation(options: MachineTranslationOptions | undefined): boolean {
  if (!options?.enabled) return false;
  const rawEnv = readProcessEnv('RULEFLOW_ENV') ?? '';
  const normalizedEnv = rawEnv.trim().toLowerCase();
  const currentEnv = (
    normalizedEnv === 'production' ||
    normalizedEnv === 'staging' ||
    normalizedEnv === 'test' ||
    normalizedEnv === 'development'
      ? normalizedEnv
      : (readProcessEnv('NODE_ENV') ?? 'development')
  ) as 'development' | 'staging' | 'test' | 'production';
  const allow = options.envs ?? ['development', 'staging'];
  return allow.includes(currentEnv);
}

function normalizeDynamicBundlePayload(
  loaded:
    | TranslationBundle
    | { messages: Record<string, string> }
    | { default: TranslationBundle | { messages: Record<string, string> } },
): TranslationBundle | { messages: Record<string, string> } | null {
  if (!loaded || typeof loaded !== 'object') return null;
  if ('default' in loaded && loaded.default && typeof loaded.default === 'object') {
    return normalizeDynamicBundlePayload(loaded.default as TranslationBundle | { messages: Record<string, string> });
  }
  if ('messages' in loaded && loaded.messages && typeof loaded.messages === 'object') {
    return loaded as TranslationBundle | { messages: Record<string, string> };
  }
  return null;
}

const formatterCache = new Map<string, IntlMessageFormat>();

function formatMessage(message: string, locale: string, params?: Record<string, unknown>): string {
  if (!params) return message;
  const cacheKey = `${locale}::${message}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new IntlMessageFormat(message, locale);
    formatterCache.set(cacheKey, formatter);
  }
  const result = formatter.format(params);
  return typeof result === 'string' ? result : String(result);
}
