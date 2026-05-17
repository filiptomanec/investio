-- ============================================================================
-- Investio — Template content seed (T-017)
-- ----------------------------------------------------------------------------
-- Vyplňuje 6 placeholder rows vytvořených v T-006 (schema.sql initial seed).
-- Používá UPDATE ... WHERE slug = '...' — NE INSERT, protože rows již existují
-- s ON CONFLICT DO NOTHING z T-006.
--
-- Pořadí: stock templates (1–3), real estate templates (4–6).
-- display_order: 1 = nejznámější/nejpoužívanější první.
--
-- Spuštění:
--   supabase db reset            (reset + apply migrations + seeds v pořadí)
--   -- nebo --
--   psql "$DATABASE_URL" -f supabase/seeds/templates.sql
--
-- Ověření:
--   SELECT slug, name_cs, display_order FROM template ORDER BY display_order;
-- ============================================================================


-- ============================================================================
-- 1. S&P 500 1995–2025
-- ----------------------------------------------------------------------------
-- CAGR ~10.3 % (nominální, s dividendami reinvestovanými) dle Damodaran NYU.
-- Zahrnuje: dot-com bubble (2000–2002), finanční krize (2008, −37 %), COVID
-- propad (2020) i silné rally (2019 +31 %, 2023 +26 %).
-- initialAmount: 50 000 USD — realistický vstup pro retail investora.
-- monthlyContribution: 500 USD — pravidelný DCA (dollar-cost averaging).
-- annualReturnPct: 0.103 — historický CAGR 1995–2025 z Damodaran dat.
-- horizonYears: 30 — odpovídá referenčnímu období šablony.
-- ============================================================================
UPDATE public.template SET
  name_cs            = 'S&P 500 — historický průměr 1995–2025',
  name_en            = 'S&P 500 — Historical Average 1995–2025',
  description_cs     = 'Simuluje 30letou investici do US akcií s průměrným ročním výnosem 10,3 % p.a. (nominálně). Zahrnuje dvě medvědí období: 2000–2002 a 2008. Vhodné pro srovnání s ostatními třídami aktiv.',
  description_en     = 'Models a 30-year US equity investment at a 10.3% p.a. nominal CAGR. Captures two bear markets (2000–02, 2008) and the long bull run. Use it as a benchmark against other asset classes.',
  inputs             = jsonb_build_object(
    'type',                'compound',
    'initialAmount',       50000,
    'monthlyContribution', 500,
    'annualReturnPct',     0.103,
    'horizonYears',        30,
    'contributionTiming',  'end'
  ),
  source_citation    = 'Damodaran, A. (NYU Stern) — Historical Returns on Stocks, Bonds and Bills: 1928–2025; Bogleheads wiki — S&P 500 historical returns',
  source_url         = 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html',
  display_order      = 1
WHERE slug = 'sp500-1995-2025';


-- ============================================================================
-- 2. MSCI World Index
-- ----------------------------------------------------------------------------
-- Globálně diverzifikovaný index ~23 rozvinutých trhů, ~1 500 akcií.
-- CAGR ~7,5 % nominálně za posledních 20+ let (MSCI factsheet, USD, NTR).
-- Nižší výnos než čistě US index, ale nižší koncentrační riziko.
-- initialAmount: 50 000 USD — srovnatelné s S&P 500 šablonou.
-- monthlyContribution: 300 USD — pravidelný DCA.
-- annualReturnPct: 0.075 — konzervativní střed pásma 7–8 % (MSCI NTR).
-- horizonYears: 25 — typický investiční horizont pro globální ETF strategii.
-- ============================================================================
UPDATE public.template SET
  name_cs            = 'MSCI World — globální akciový index',
  name_en            = 'MSCI World — Global Equity Index',
  description_cs     = 'Globálně diverzifikovaný index ~23 rozvinutých trhů. Průměrný výnos ~7,5 % p.a. (USD, NTR) za posledních 20+ let. Nižší volatilita než čistě americký index.',
  description_en     = 'Broadly diversified across ~23 developed markets. Average ~7.5% p.a. (USD, net total return) over 20+ years. Lower concentration risk than pure US equity.',
  inputs             = jsonb_build_object(
    'type',                'compound',
    'initialAmount',       50000,
    'monthlyContribution', 300,
    'annualReturnPct',     0.075,
    'horizonYears',        25,
    'contributionTiming',  'end'
  ),
  source_citation    = 'MSCI World Index Factsheet — annualized performance (USD, NTR); MSCI.com; Vanguard FTSE All-World historical data as proxy',
  source_url         = 'https://www.msci.com/indexes/index/990100',
  display_order      = 2
WHERE slug = 'msci-world';


-- ============================================================================
-- 3. CZ dividendové akcie (PX index proxy)
-- ----------------------------------------------------------------------------
-- Pražská burza (PX index) — historicky nižší výnosy než západ, ~5–6 % p.a.
-- nominálně za posledních 15 let (ČNB statistiky, Damodaran emerging markets).
-- Dividendový výnos PX ~3–4 %, kapitálový zisk skromný.
-- Zahrnuje lokálně relevantní tituly: ČEZ, Komerční banka, Philip Morris ČR.
-- initialAmount: 200 000 CZK — typická Czech retail investice.
-- monthlyContribution: 3 000 CZK — pravidelný DCA v CZK.
-- annualReturnPct: 0.06 — nominální CAGR kombinující dividendy + kapitálový růst.
-- horizonYears: 20 — relevantní horizont pro dlouhodobého CZ investora.
-- ============================================================================
UPDATE public.template SET
  name_cs            = 'CZ dividendové akcie (PX index)',
  name_en            = 'CZ Dividend Stocks (PX Index)',
  description_cs     = 'Modeluje investici do CZ dividendových akcií v duchu PX indexu. Průměrný výnos ~6 % p.a. (dividendy + kapitálový růst). Lokálně relevantní volba pro CZ retailového investora.',
  description_en     = 'Models investment in CZ dividend stocks mirroring the PX index. ~6% p.a. average return (yield + capital gain). Locally relevant option for a Czech retail investor.',
  inputs             = jsonb_build_object(
    'type',                'compound',
    'initialAmount',       200000,
    'monthlyContribution', 3000,
    'annualReturnPct',     0.06,
    'horizonYears',        20,
    'contributionTiming',  'end'
  ),
  source_citation    = 'Burza cenných papírů Praha — PX index historická data; Damodaran Emerging Markets Equity Risk Premium; ČNB — výnosnost domácích cenných papírů',
  source_url         = 'https://www.pse.cz/indexy/px',
  display_order      = 3
WHERE slug = 'cz-dividend-stocks';


-- ============================================================================
-- 4. CZ činovní dům (multi-unit, Brno/Ostrava)
-- ----------------------------------------------------------------------------
-- Typický 8–12-bytový dům v Brně nebo Ostravě.
-- Kupní cena: 25 000 000 CZK (cca 950 CZK/m², 2 500 m² GFA — market rate 2025).
-- Nájemné: 120 000 CZK/měs (10 jednotek × 12 000 CZK — standardní Brno/Ostrava).
-- Hypotéka: 30 let, 4,5 % p.a. (5letá fixace, tržní sazba 2025 dle Hypoindex).
-- vacancyRatePct: 0.05 — standardní prázdnota pro multi-unit ve středně velkém městě.
-- annualAppreciationPct: 0.03 — konzervativní odhad mimo Prahu.
-- horizonYears: 25 — typický horizont pro komerční nemovitost.
-- ============================================================================
UPDATE public.template SET
  name_cs            = 'CZ činovní dům (Brno / Ostrava)',
  name_en            = 'CZ Multi-Unit Residential Building',
  description_cs     = '8–12-bytový dům v Brně nebo Ostravě. Kupní cena 25 mil. Kč, nájemné 120 tis. Kč/měs. Tradiční pasivní investice s vyšším kapitálovým vstupem. Hypotéka 30 let / 4,5 % p.a.',
  description_en     = '8–12-unit building in Brno or Ostrava. Purchase price CZK 25M, monthly rent CZK 120K. Classic passive investment with high capital requirement. 30-year mortgage at 4.5% p.a.',
  inputs             = jsonb_build_object(
    'type',                    'real_estate',
    'purchasePrice',           25000000,
    'downPayment',             7500000,
    'mortgage',                jsonb_build_object(
                                 'annualRatePct', 0.045,
                                 'termYears',     30
                               ),
    'monthlyRent',             120000,
    'monthlyExpenses',         15000,
    'vacancyRatePct',          0.05,
    'maintenancePctOfRent',    0.05,
    'annualAppreciationPct',   0.03,
    'annualRentGrowthPct',     0.025,
    'incomeTaxPct',            0.15,
    'horizonYears',            25
  ),
  source_citation    = 'Sreality.cz — inzerce bytových domů Brno/Ostrava 2025; Hypoindex.cz — průměrná hypoteční sazba (5,19 % 05/2026, ~4,5 % 2025); ČNB — ARAD databáze úrokových sazeb',
  source_url         = 'https://www.sreality.cz/hledani/prodej/domy/dum-s-byty',
  display_order      = 4
WHERE slug = 'cz-apartment-house';


-- ============================================================================
-- 5. Krátkodobý pronájem — Airbnb/Booking (turistická oblast ČR)
-- ----------------------------------------------------------------------------
-- Typický apartmán v turistické lokalitě (Praha centrum, Krkonoše, Šumava).
-- Kupní cena: 6 000 000 CZK (2+kk Praha okraj, nebo vybavená chata v horách).
-- Nájemné (brutto): 45 000 CZK/měs — odpovídá ~75 % occupancy × 2 000 CZK/noc.
-- vacancyRatePct: 0.20 — sezónní výkyvy (léto > zima; off-season propad).
-- monthlyExpenses: 10 000 CZK — úklid, utility, Airbnb fee (~15 %), správa.
-- maintenancePctOfRent: 0.10 — vyšší opotřebení při krátkodobém pronájmu.
-- annualAppreciationPct: 0.035 — Praha okraj/turistické lokality mírně nad průměrem.
-- horizonYears: 15 — kratší horizont reflektuje regulační/platformové riziko.
-- ============================================================================
UPDATE public.template SET
  name_cs            = 'Krátkodobý pronájem (Airbnb styl)',
  name_en            = 'Short-Term Rental (Airbnb-Style)',
  description_cs     = 'Apartmán nebo chata v turistické lokalitě. Kupní cena 6 mil. Kč, brutto nájemné 45 tis. Kč/měs při 80 % obsazenosti. Vyšší výnos, vyšší management overhead a regulační riziko.',
  description_en     = 'Apartment or cottage in a tourist area. Purchase price CZK 6M, gross rent CZK 45K/month at ~80% occupancy. Higher yield but higher management overhead and regulatory risk.',
  inputs             = jsonb_build_object(
    'type',                    'real_estate',
    'purchasePrice',           6000000,
    'downPayment',             1800000,
    'mortgage',                jsonb_build_object(
                                 'annualRatePct', 0.045,
                                 'termYears',     25
                               ),
    'monthlyRent',             45000,
    'monthlyExpenses',         10000,
    'vacancyRatePct',          0.20,
    'maintenancePctOfRent',    0.10,
    'annualAppreciationPct',   0.035,
    'annualRentGrowthPct',     0.020,
    'incomeTaxPct',            0.15,
    'horizonYears',            15
  ),
  source_citation    = 'AirDNA — Czech Republic short-term rental market data 2024; Airbnb Newsroom CZ host trends; Bezrealitky.cz — průměrné nájmy Praha; MMR ČR — zákon o krátkodobém pronájmu',
  source_url         = 'https://www.airdna.co/vacation-rental-data/app/cz',
  display_order      = 5
WHERE slug = 'holiday-rental';


-- ============================================================================
-- 6. Městský byt — dlouhodobý pronájem Praha
-- ----------------------------------------------------------------------------
-- 2+kk nebo 3+kk v Praze mimo centrum (Praha 4, 6, 9, 10).
-- Kupní cena: 8 000 000 CZK — průměrný byt ~55 m², ~145 000 CZK/m² (2025).
-- Nájemné: 28 000 CZK/měs — Praha průměr pro 2+kk (data Bezrealitky/Deloitte 2025).
-- vacancyRatePct: 0.05 — pražský trh s nájmy je tažen poptávkou, nízká prázdnota.
-- annualAppreciationPct: 0.04 — Praha dlouhodobě ~4 % ročně (Deloitte CZ RE report).
-- horizonYears: 20 — typický horizont retail investora v rezidenčních nemovitostech.
-- Hypotéka: 30 let, 4,5 % — standardní 5letá fixace na CZ trhu 2025.
-- ============================================================================
UPDATE public.template SET
  name_cs            = 'Pražský byt — dlouhodobý pronájem',
  name_en            = 'Prague Flat — Long-Term Rental',
  description_cs     = '2+kk nebo 3+kk v Praze (mimo centrum). Kupní cena 8 mil. Kč, nájemné 28 tis. Kč/měs. Nejběžnější forma CZ realitní investice. Praha cresce historicky ~4 % ročně.',
  description_en     = '2-bed flat outside Prague centre. Purchase price CZK 8M, rent CZK 28K/month. The most common Czech real estate investment. Prague capital growth historically ~4% p.a.',
  inputs             = jsonb_build_object(
    'type',                    'real_estate',
    'purchasePrice',           8000000,
    'downPayment',             2000000,
    'mortgage',                jsonb_build_object(
                                 'annualRatePct', 0.045,
                                 'termYears',     30
                               ),
    'monthlyRent',             28000,
    'monthlyExpenses',         4000,
    'vacancyRatePct',          0.05,
    'maintenancePctOfRent',    0.05,
    'annualAppreciationPct',   0.04,
    'annualRentGrowthPct',     0.025,
    'incomeTaxPct',            0.15,
    'horizonYears',            20
  ),
  source_citation    = 'Deloitte — Czech Real Estate Market Report 2024/2025; Bezrealitky.cz — průměrné nájmy Praha 2025; Hypoindex.cz — hypoteční sazby CZ',
  source_url         = 'https://www.bezrealitky.cz/informace/ke-stazeni',
  display_order      = 6
WHERE slug = 'urban-flat';


-- ============================================================================
-- Ověřovací SELECT (spustit po apply pro sanity check)
-- ============================================================================
-- SELECT slug, name_cs, display_order,
--        (inputs->>'annualReturnPct')::float AS annual_return_pct,
--        (inputs->>'purchasePrice')::int     AS purchase_price
-- FROM public.template
-- ORDER BY display_order;
