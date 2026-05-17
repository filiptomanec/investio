# Investio — Template Content Documentation (T-017)

Source citations, parameter rationale, and editorial notes for the 6 predefined scenario templates.

---

## 1. `sp500-1995-2025` — S&P 500 Historical Average 1995–2025

### Co to je / What it is

**CZ:** Šablona modeluje pravidelnou investici do amerického akciového trhu reprezentovaného indexem S&P 500. Výchozí vstupní kapitál 50 000 USD + měsíční DCA (dollar-cost averaging) 500 USD po dobu 30 let.

**EN:** Template models recurring investment into US equities tracking the S&P 500 index. Starting capital USD 50 000 plus USD 500 monthly DCA over 30 years.

### Historický kontext / Historical context

**CZ:** Referenční období 1995–2025 zahrnuje 30 let a tři výrazná cenová přerušení:
- Dot-com bubble (2000–2002): index klesl o ~49 %
- Finanční krize 2008: pokles −37 % v jediném roce
- COVID propad (únor–duben 2020): rychlý pokles ~34 %, rychlá obnova do konce roku

Navzdory těmto šokům byl nominální CAGR s reinvestovanými dividendami **~10,3 % p.a.** (zdroj: Damodaran NYU, historická data S&P 500 total return 1928–2025). Reálný CAGR po inflaci (USD) byl přibližně 7–8 %.

**EN:** The 1995–2025 window covers 30 years and three major drawdowns: dot-com bust (−49%), 2008 financial crisis (−37%), COVID crash (−34%). Despite these shocks, the nominal CAGR with reinvested dividends was approximately **10.3% p.a.** (source: Damodaran NYU historical S&P 500 total return data). Real CAGR after USD inflation was roughly 7–8%.

### Parametry / Parameters

| Pole | Hodnota | Zdůvodnění |
|---|---|---|
| `initialAmount` | 50 000 USD | Realistická vstupní investice pro retail investora mimo CZ |
| `monthlyContribution` | 500 USD | Pravidelný DCA — průměrná schopnost spoření retail investora |
| `annualReturnPct` | 0.103 | Historický CAGR 1995–2025 dle Damodaran NYU dat |
| `horizonYears` | 30 | Odpovídá referenčnímu období šablony |
| `contributionTiming` | `end` | Standardní konvence (vklad koncem měsíce) |

### Limity / Limitations

**CZ:**
- Minulé výnosy nezaručují budoucí výsledky. CAGR 10,3 % zahrnuje specificky příznivé podmínky (nízké úrokové sazby 2009–2022, tech rally).
- Model abstrahuje od: daní z kapitálových zisků, poplatků ETF/fondu, měnového rizika (CZK/USD), inflace.
- Scénář není upraven o inflaci — reálná kupní síla je nižší.
- Geopolitické a regulační šoky (de-globalizace, AI regulace) nejsou modelovány.

**EN:**
- Past returns do not guarantee future results. The 10.3% CAGR reflects a historically favourable environment (low rates 2009–2022, tech rally).
- Model excludes: capital gains tax, ETF/fund fees, CZK/USD FX risk, inflation adjustment.
- Returns are nominal; real purchasing power is lower.
- Geopolitical shocks and structural breaks are not captured.

### Zdroj dat / Data source

- Damodaran, A. (NYU Stern) — *Historical Returns on Stocks, Bonds and Bills: 1928–2025*: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html
- Bogleheads wiki — S&P 500 returns overview: https://www.bogleheads.org/wiki/S%26P_500

---

## 2. `msci-world` — MSCI World Global Equity Index

### Co to je / What it is

**CZ:** Šablona modeluje investici do globálně diverzifikovaného akciového indexu MSCI World, který pokrývá ~1 500 akcií z ~23 rozvinutých trhů (USA ~70 %, Japonsko ~6 %, UK ~4 %, Francie/Německo/ostatní).

**EN:** Template models investment in the MSCI World index, covering ~1 500 large- and mid-cap equities across ~23 developed markets (USA ~70%, Japan ~6%, UK ~4%, France/Germany/rest).

### Historický kontext / Historical context

**CZ:** MSCI World (USD, Net Total Return) dosáhl za posledních 20+ let průměrného ročního výnosu přibližně **7–8 % p.a.** Šablona používá konzervativní střed pásma 7,5 %. Výnos je nižší než S&P 500 z důvodu menšího váhového zastoupení US tech sektoru v globálním indexu, kompenzováno nižší koncentrační volatilitou.

**EN:** MSCI World (USD, NTR) delivered approximately **7–8% p.a.** average annual return over 20+ years. The template uses 7.5% as a conservative midpoint. The lower return compared to S&P 500 reflects smaller US tech weighting, offset by lower concentration risk.

### Parametry / Parameters

| Pole | Hodnota | Zdůvodnění |
|---|---|---|
| `initialAmount` | 50 000 USD | Srovnatelné s S&P 500 šablonou pro přímé porovnání |
| `monthlyContribution` | 300 USD | DCA — mírně nižší než US-only strategie |
| `annualReturnPct` | 0.075 | Konzervativní střed pásma 7–8 % (MSCI factsheet NTR) |
| `horizonYears` | 25 | Typický horizont globálního ETF investora |

### Limity / Limitations

**CZ:**
- Index je denominovaný v USD — CZ investor nese FX riziko CZK/USD.
- Výnos 7,5 % je retroaktivní průměr; budoucí výnos závisí na globálním hospodářském růstu.
- Model nezohledňuje TER (total expense ratio) typického MSCI World ETF (cca 0,1–0,3 % p.a.).
- "Rozvinuté trhy" nezahrnují EM (emerging markets) — Čína, Indie, EM Evropa nejsou zastoupeny.

**EN:**
- Index denominated in USD — Czech investors bear CZK/USD FX risk.
- The 7.5% is a historical average; future returns depend on global GDP growth.
- Model excludes ETF total expense ratio (typically 0.1–0.3% p.a. for MSCI World funds).
- "Developed markets" excludes EM — China, India, EM Europe not represented.

### Zdroj dat / Data source

- MSCI World Index page: https://www.msci.com/indexes/index/990100
- Vanguard FTSE All-World UCITS ETF factsheet (USD, NTR proxy): https://www.vanguard.co.uk/professional/product/etf/equity/9505/ftse-all-world-ucits-etf-usd-accumulating

---

## 3. `cz-dividend-stocks` — CZ Dividend Stocks (PX Index)

### Co to je / What it is

**CZ:** Šablona modeluje investici do českých dividendových akcií v duchu indexu PX Pražské burzy. Typické tituly: ČEZ (energetika, dividendový výnos ~5–7 %), Komerční banka, Philip Morris ČR, Erste Group. Denominace v CZK — bez FX rizika pro českého investora.

**EN:** Template models investment in Czech dividend stocks mirroring the Prague Stock Exchange PX index. Representative stocks: ČEZ (energy, ~5–7% dividend yield), Komerční banka, Philip Morris ČR, Erste Group. CZK-denominated — no FX risk for Czech investors.

### Historický kontext / Historical context

**CZ:** PX index historicky zaostává za západ­ními trhy. Za posledních 15 let (2010–2025) dosáhl nominálního CAGR přibližně **5–7 % p.a.** (kombinace dividendového výnosu ~4 % + skromný kapitálový růst ~1–3 %). Šablona používá 6 % jako realistický dlouhodobý průměr. Faktor: CZ trh je malý, méně likvidní a dominantní tituly jsou z tradičních sektorů (energetika, banky, tabák).

**EN:** The PX index has historically underperformed Western markets. Over the past 15 years (2010–2025), it delivered a nominal CAGR of approximately **5–7% p.a.** (dividend yield ~4% + modest capital appreciation ~1–3%). Template uses 6% as a realistic long-term average. The Czech market is small, less liquid, and dominated by traditional sectors (energy, banks, tobacco).

### Parametry / Parameters

| Pole | Hodnota | Zdůvodnění |
|---|---|---|
| `initialAmount` | 200 000 CZK | Typická vstupní investice pro CZ retail investora |
| `monthlyContribution` | 3 000 CZK | Pravidelný DCA v CZK |
| `annualReturnPct` | 0.06 | Nominální CAGR PX proxy (dividendy + kapitál) |
| `horizonYears` | 20 | Standardní horizont pro CZ dlouhodobého investora |

### Limity / Limitations

**CZ:**
- PX index má nízkou diverzifikaci — top 5 titulů tvoří >60 % indexu.
- Dividendy jsou předmětem 15% srážkové daně (pro fyzické osoby v CZ) — model to nemodeluje (annualReturnPct je brutto).
- Kapitálový zisk u akcií držených >3 roky je v CZ osvobozen od daně (časový test) — zvýhodňuje tuto strategii vs. výnosy z nemovitostí.
- Nízká likvidita u menších titulů = vyšší bid-ask spread.

**EN:**
- PX index has low diversification — top 5 stocks >60% of index weight.
- Dividends subject to 15% withholding tax for Czech individuals — model uses gross return.
- Czech capital gains tax exemption after 3-year holding period favours this strategy vs. real estate income.
- Low liquidity in smaller-cap names = higher bid-ask spreads.

### Zdroj dat / Data source

- Burza cenných papírů Praha — PX index historical data: https://www.pse.cz/indexy/px
- Damodaran, A. — Country Risk Premiums (Czech Republic): https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html
- ČNB ARAD — výnosnost domácích cenných papírů: https://www.cnb.cz/arad/

---

## 4. `cz-apartment-house` — CZ Multi-Unit Residential Building (Brno/Ostrava)

### Co to je / What it is

**CZ:** Šablona modeluje koupi a provoz 8–12-bytového činovního domu v Brně nebo Ostravě. Jde o tradiční formu pasivní investice v ČR — investor vlastní celý dům a pronajímá jednotlivé byty dlouhodobě. Kupní cena 25 mil. Kč, vlastní kapitál 7,5 mil. Kč (30 % záloha), zbytek hypotéka.

**EN:** Template models buying and operating an 8–12-unit residential building in Brno or Ostrava. Traditional Czech passive investment — investor owns the whole building and rents units individually on long-term leases. Purchase price CZK 25M, equity CZK 7.5M (30% down), remainder mortgaged.

### Historický kontext / Historical context

**CZ:** Ceny bytových domů mimo Prahu rostou průměrně ~3 % ročně (konzervativní odhad, ČSÚ indexy cen stavebních prací + nemovitostí 2010–2025). Nájemné v Brně a Ostravě roste přibližně 2,5 % ročně. Hypoteční sazby v 2025: průměrná nabídková sazba ~4,5–5,2 % dle Hypoindex (5letá fixace; Swiss Life Hypoindex 5/2026: 5,19 %).

**EN:** Apartment building prices outside Prague have grown ~3% annually (conservative estimate, Czech Statistical Office property price indices 2010–2025). Rents in Brno and Ostrava grow approximately 2.5% p.a. Mortgage rates in 2025: average offered rate ~4.5–5.2% for 5-year fixation (Hypoindex May 2026: 5.19%).

### Parametry / Parameters

| Pole | Hodnota | Zdůvodnění |
|---|---|---|
| `purchasePrice` | 25 000 000 CZK | Tržní cena 8–12 bytového domu, Brno/Ostrava 2025 |
| `downPayment` | 7 500 000 CZK | 30 % — standardní LTV pro investiční nemovitost |
| `mortgage.annualRatePct` | 0.045 | Tržní sazba 2025 (5letá fixace, ~4,5 %) |
| `mortgage.termYears` | 30 | Maximální splatnost dostupná na CZ trhu |
| `monthlyRent` | 120 000 CZK | 10 jednotek × 12 000 CZK (Brno/Ostrava průměr) |
| `monthlyExpenses` | 15 000 CZK | Správa, fond oprav, pojištění, accountant |
| `vacancyRatePct` | 0.05 | Standardní pro multi-unit mimo Praha |
| `maintenancePctOfRent` | 0.05 | Standardní údržba (5 % nájemného) |
| `annualAppreciationPct` | 0.03 | Konzervativní odhad pro Brno/Ostrava |
| `annualRentGrowthPct` | 0.025 | Historický růst nájmů Brno/Ostrava |
| `incomeTaxPct` | 0.15 | CZ sazba daně z příjmů FO (základní pásmo) |
| `horizonYears` | 25 | Typický horizont pro komerční nemovitostní investici |

### Limity / Limitations

**CZ:**
- Model neobsahuje: daňový paušál 30 % na výdaje (§9 ZDP), který by snižoval efektivní daňovou zátěž.
- Hypoteční sazba se mění při refixaci (každých 5 let) — model drží konstantní sazbu po celou dobu.
- Strukturální renovace (střecha, rozvody) nejsou zachyceny v `monthlyExpenses` — jsou nepravidelné a výrazné.
- Regulační riziko: případná regulace nájmů, změny stavebního zákona.
- Nájemní právo v ČR chrání nájemce — vystěhování neplatiče může trvat 6–12 měsíců.

**EN:**
- Model excludes the 30% lump-sum expense deduction (§9 Czech Income Tax Act) which would reduce effective tax.
- Mortgage rate changes at each re-fixation period (every 5 years) — model holds constant rate.
- Major structural repairs (roof, utilities) not captured in `monthlyExpenses` — these are lumpy and large.
- Regulatory risk: potential rent control, building code changes.
- Czech tenancy law strongly protects tenants — evicting a non-paying tenant can take 6–12 months.

### Zdroj dat / Data source

- Sreality.cz — bytové domy k prodeji, Brno/Ostrava: https://www.sreality.cz/hledani/prodej/domy/dum-s-byty
- Hypoindex.cz — průměrné hypoteční sazby CZ: https://www.hypoindex.cz/
- ČSÚ — index cen bytových nemovitostí: https://www.czso.cz/csu/czso/ceny-sledovane-nemovitosti

---

## 5. `holiday-rental` — Short-Term Rental (Airbnb-Style)

### Co to je / What it is

**CZ:** Šablona modeluje koupi apartmánu nebo chaty v turistické lokalitě a jeho provoz jako krátkodobý pronájem (Airbnb, Booking.com). Typický příklad: 1+1 nebo 2+kk v centru Prahy nebo horský apartmán (Krkonoše, Beskydy, Šumava). Kupní cena 6 mil. Kč, brutto nájemné 45 000 CZK/měs při průměrné obsazenosti ~80 %.

**EN:** Template models buying an apartment or cottage in a tourist location and operating it as a short-term rental (Airbnb, Booking.com). Typical example: 1-bed Prague centre flat or mountain apartment (Krkonoše, Beskydy). Purchase price CZK 6M, gross rent CZK 45 000/month at ~80% occupancy.

### Historický kontext / Historical context

**CZ:** CZ krátkodobý pronájem boom nastal v letech 2015–2019. Praha byla v top 20 evropských Airbnb destinacích. COVID způsobil dramatický výpadek 2020–2021. Trh se obnovil 2022–2024 s vyšší průměrnou cenou za noc. Brutto výnos (gross yield) krátkodobého pronájmu v turistických lokalitách se pohybuje 6–9 % — výrazně výše než dlouhodobý pronájem (3–5 %), ale s vyšší vakancí, opotřebením a provozními náklady.

**EN:** Czech short-term rental market boomed 2015–2019. Prague ranked in the top 20 European Airbnb markets. COVID caused a severe 2020–2021 downturn; market recovered 2022–2024 at higher per-night rates. Gross yield for short-term rentals in tourist areas: 6–9% — significantly above long-term rental (3–5%) but with higher vacancy, wear and operating costs.

### Parametry / Parameters

| Pole | Hodnota | Zdůvodnění |
|---|---|---|
| `purchasePrice` | 6 000 000 CZK | 1+1/2+kk Praha okraj nebo horský apartmán |
| `downPayment` | 1 800 000 CZK | 30 % — investiční nemovitost |
| `mortgage.annualRatePct` | 0.045 | Tržní sazba 2025 (5letá fixace) |
| `mortgage.termYears` | 25 | Kratší splatnost = rychlejší equity build-up |
| `monthlyRent` | 45 000 CZK | Brutto při ~75–80 % obsazenosti; cca 2 000 CZK/noc |
| `monthlyExpenses` | 10 000 CZK | Úklid, utilities, Airbnb fee (~15 %), správa |
| `vacancyRatePct` | 0.20 | Sezónní výkyvy, off-season propad |
| `maintenancePctOfRent` | 0.10 | Vyšší opotřebení při rotaci hostů |
| `annualAppreciationPct` | 0.035 | Praha okraj + turistické lokality mírně nad průměrem |
| `annualRentGrowthPct` | 0.020 | Konzervativní — platformové poplatky mohou stoupat |
| `incomeTaxPct` | 0.15 | CZ sazba daně z příjmů FO |
| `horizonYears` | 15 | Kratší horizont — regulační a platformové riziko |

### Limity / Limitations

**CZ:**
- Regulační riziko je reálné: Praha diskutuje omezení krátkodobého pronájmu (EU směrnice STR, MMR ČR zákon o krátkodobém pronájmu). Zákon zatím nebyl přijat, ale pravděpodobnost omezení v 10letém horizontu je nezanedbatelná.
- Airbnb/Booking poplatky (15–20 % tržeb) nejsou plně modelovány jako fixní procento — jsou zahrnuty v `monthlyExpenses`.
- Obsazenost 80 % je průměr; v off-season může klesnout na 20–40 %.
- Model nepočítá s náklady na vybavení a redesign (nutné každých ~5 let pro udržení hodnocení).

**EN:**
- Regulatory risk is real: Prague is discussing short-term rental restrictions (EU STR directive, Czech MMR legislation). No law passed yet, but probability of restrictions within a 10-year horizon is non-negligible.
- Airbnb/Booking fees (15–20% of revenue) not modelled as explicit percentage — included in `monthlyExpenses`.
- 80% occupancy is an average; off-season may drop to 20–40%.
- Furnishing and redesign costs every ~5 years (needed to maintain ratings) not modelled.

### Zdroj dat / Data source

- AirDNA — Czech Republic STR market data: https://www.airdna.co/vacation-rental-data/app/cz
- MMR ČR — legislativa krátkodobého pronájmu: https://www.mmr.cz/
- Bezrealitky.cz — průměrné nájmy Praha: https://www.bezrealitky.cz/

---

## 6. `urban-flat` — Prague Flat, Long-Term Rental

### Co to je / What it is

**CZ:** Šablona modeluje nejběžnější formu CZ realitní investice: koupě bytu 2+kk nebo 3+kk v Praze (mimo centrum — Praha 4, 6, 9, 10) a jeho pronájem na dlouhodobou smlouvu. Kupní cena 8 mil. Kč odpovídá cca 55 m² v průměrné poloze za ~145 000 CZK/m² (tržní úroveň Praha 2025).

**EN:** Template models the most common Czech real estate investment: buying a 2- or 3-bed flat in Prague outside the centre (districts 4, 6, 9, 10) and renting on a long-term lease. Purchase price CZK 8M corresponds to ~55 m² at ~CZK 145 000/m² (Prague market 2025).

### Historický kontext / Historical context

**CZ:** Praha patří k evropským trhům s nejvyšším dlouhodobým cenovým růstem nemovitostí. Deloitte Real Estate Market Report 2024 uvádí průměrný roční kapitálový zisk ~4 % p.a. za posledních 10 let. Nájemné roste rychleji — přibližně 3–5 % ročně v 2020–2025 (vysoká poptávka, nízká výstavba). Průměrné nájemné pro 2+kk Praha: 25 000–32 000 CZK/měs (Bezrealitky/Deloitte 2025). Brutto výnos: 3,5–4,5 % (nízký vs. Brno/Ostrava díky vyšším kupním cenám).

**EN:** Prague is among Europe's strongest long-term residential price growth markets. Deloitte Real Estate Market Report 2024 shows ~4% p.a. average annual capital appreciation over 10 years. Rents growing faster — ~3–5% p.a. 2020–2025 (high demand, low supply). Average rent for a 2-bed Prague flat: CZK 25 000–32 000/month (Bezrealitky/Deloitte 2025). Gross yield: 3.5–4.5% (lower than Brno/Ostrava due to higher purchase prices).

### Parametry / Parameters

| Pole | Hodnota | Zdůvodnění |
|---|---|---|
| `purchasePrice` | 8 000 000 CZK | ~55 m², Praha okraj, ~145 000 CZK/m² (2025) |
| `downPayment` | 2 000 000 CZK | 25 % — běžná záloha pro investiční byt |
| `mortgage.annualRatePct` | 0.045 | Tržní sazba 2025 (5letá fixace) |
| `mortgage.termYears` | 30 | Maximální splatnost, snižuje měsíční splátku |
| `monthlyRent` | 28 000 CZK | Průměr 2+kk Praha okraj (Bezrealitky 2025) |
| `monthlyExpenses` | 4 000 CZK | Správa, fond oprav, pojištění |
| `vacancyRatePct` | 0.05 | Pražský trh: vysoká poptávka = nízká prázdnota |
| `maintenancePctOfRent` | 0.05 | Standardní |
| `annualAppreciationPct` | 0.04 | Praha historicky ~4 % p.a. (Deloitte 2024) |
| `annualRentGrowthPct` | 0.025 | Konzervativní — pod historickým průměrem 2020–2025 |
| `incomeTaxPct` | 0.15 | CZ sazba daně z příjmů FO |
| `horizonYears` | 20 | Typický horizont retail investora v rezidenčních nem. |

### Limity / Limitations

**CZ:**
- Praha ceny bydlení jsou výrazně nad fundament­álními hodnotami (Price-to-Income ratio v top 10 Evropa). Riziko korekce není modelováno.
- Zákon o nájemním bydlení (návrh 2025+) může přinést další regulaci — zahrnutí práva předkupního pro nájemce aj.
- Brutto výnos 4,2 % (28 000 × 12 / 8 000 000) je jeden z nejnižších v ČR — investor sází primárně na kapitálový zisk, ne na cashflow.
- Daňová optimalizace (§9 ZDP, 30% paušál) není modelována — efektivní daňová zátěž může být nižší.

**EN:**
- Prague property prices are significantly above fundamental values (Price-to-Income ratio top 10 in Europe). A price correction is not modelled.
- Proposed rental housing legislation (2025+) may bring further tenant protections including pre-emptive purchase rights.
- Gross yield of 4.2% (28 000 × 12 / 8 000 000) is one of the lowest in CZ — investor bets primarily on capital appreciation, not cashflow.
- Tax optimisation (Czech §9 Income Tax Act, 30% lump-sum deduction) not modelled — effective tax could be lower.

### Zdroj dat / Data source

- Deloitte — Czech Real Estate Market Report 2024/2025: https://www.deloitte.com/cz/cs/pages/real-estate/articles/czech-real-estate-market-overview.html
- Bezrealitky.cz — statistiky nájmů Praha: https://www.bezrealitky.cz/
- Hypoindex.cz — průměrné hypoteční sazby: https://www.hypoindex.cz/

---

## Disclaimer

**CZ:** Tyto šablony jsou edukativní startpointy, nikoliv investiční doporučení. Historické výnosy nezaručují budoucí výsledky. Kalkulačka používá zjednodušené modely, které nepostihují veškeré daňové, právní, tržní ani operační aspekty investice. Před rozhodnutím o investici konzultujte licencovaného investičního poradce nebo daňového poradce.

**EN:** These templates are educational starting points, not investment advice. Past performance does not guarantee future results. The calculator uses simplified models that do not capture all tax, legal, market, or operational aspects of an investment. Before making investment decisions, consult a licensed investment adviser or tax professional.

---

## Appendix: Template Summary Table

| Slug | Type | Currency | annualReturnPct / grossYield | Source |
|---|---|---|---|---|
| `sp500-1995-2025` | compound | USD | 10.3% p.a. | Damodaran NYU / histretSP.html |
| `msci-world` | compound | USD | 7.5% p.a. | MSCI World factsheet |
| `cz-dividend-stocks` | compound | CZK | 6.0% p.a. | PSE PX index / ČNB ARAD |
| `cz-apartment-house` | real_estate | CZK | ~5.8% gross yield | Sreality.cz / Hypoindex.cz |
| `holiday-rental` | real_estate | CZK | ~9.0% gross yield | AirDNA CZ / Bezrealitky.cz |
| `urban-flat` | real_estate | CZK | ~4.2% gross yield | Deloitte CZ RE / Bezrealitky.cz |
