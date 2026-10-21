import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

// STABLE URL: https://investio-web.vercel.app/privacy
// Do NOT change this path — App Store Connect has this URL registered.
// Any redirect will cause Apple review to reject the app.

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Investio" },
      {
        name: "description",
        content:
          "Investio privacy policy. The app collects no data — all calculations run on-device. Full policy in English and Czech.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header — matches main app shell */}
      <header className="max-w-3xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <Logo />
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to calculator
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
        {/* ── ENGLISH ─────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <p className="text-xs text-muted-foreground mb-6">Last updated: 2026-05-27</p>

          <h1 className="text-3xl font-bold text-foreground mb-4">Privacy Policy for Investio</h1>

          <div className="bg-muted rounded-lg px-6 py-4 mb-8">
            <p className="text-foreground font-semibold">
              Summary: Investio collects no data from you. Nothing. Ever.
            </p>
          </div>

          <div className="space-y-8 text-foreground">
            <div>
              <h2 className="text-xl font-semibold mb-3">What data we collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                None. Investio does not collect, store, transmit, or share any personal data or
                usage information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">How the app works</h2>
              <p className="text-muted-foreground leading-relaxed">
                Investio is an offline compound-interest calculator. Every calculation runs entirely
                on your device using the numbers you type in. Nothing is sent to any server. There
                is no backend. There is no database with your inputs. When you close the app, your
                inputs are gone (only your display preferences — theme and language — are saved
                locally on your device via your phone&apos;s own storage, and only while the app is
                installed).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Analytics and crash reporting</h2>
              <p className="text-muted-foreground leading-relaxed">
                Investio ships no analytics SDKs and no crash reporting tools.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Verification: The mobile app uses no Sentry, no Firebase, no Amplitude, no Mixpanel,
                no AppCenter, or any equivalent SDK. This was a deliberate decision consistent with
                the app&apos;s privacy-first design. The web version of Investio is a separate
                product and its privacy practices are described separately.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Advertising and tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                There are no ads in Investio. No advertising identifiers (IDFA) are accessed. No
                cross-app or cross-site tracking occurs.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Third-party SDKs that phone home</h2>
              <p className="text-muted-foreground leading-relaxed">
                None. The runtime dependencies (Expo, React Native, victory-native, NativeWind) are
                open-source libraries that execute locally. None of them are configured to send data
                anywhere.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Permissions requested</h2>
              <p className="text-muted-foreground leading-relaxed">
                None. Investio requests zero device permissions: no camera, no microphone, no
                location, no contacts, no notifications, no health data, no Bluetooth, no tracking.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Children&apos;s privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Investio does not knowingly collect data from anyone, including children under 13.
                Since the app collects no data at all, it is safe for all age groups (Age Rating:
                4+).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Changes to this policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                If we ever change this policy — for example, if a future version adds optional
                analytics — we will update this document with a new date and notify users via the
                App Store &quot;What&apos;s New&quot; section. Until then, this policy remains: we
                collect nothing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about this privacy policy:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Filip Tomanec</strong>
                </li>
                <li>
                  Email:{" "}
                  <a
                    href="mailto:tomanec.f@gmail.com"
                    className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                  >
                    tomanec.f@gmail.com
                  </a>
                </li>
                <li>
                  GitHub:{" "}
                  <a
                    href="https://github.com/filiptomanec/investio"
                    className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/filiptomanec/investio
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-border mb-16" />

        {/* ── ČESKY ───────────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-muted-foreground mb-6">Poslední aktualizace: 27. 5. 2026</p>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Zásady ochrany osobních údajů — Investio
          </h1>

          <div className="bg-muted rounded-lg px-6 py-4 mb-8">
            <p className="text-foreground font-semibold">
              Shrnutí: Investio neshromažďuje žádná tvoje data. Vůbec žádná. Nikdy.
            </p>
          </div>

          <div className="space-y-8 text-foreground">
            <div>
              <h2 className="text-xl font-semibold mb-3">Jaká data shromažďujeme</h2>
              <p className="text-muted-foreground leading-relaxed">
                Žádná. Investio neshromažďuje, neukládá, nepřenáší ani nesdílí žádné osobní údaje
                ani informace o použití.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Jak aplikace funguje</h2>
              <p className="text-muted-foreground leading-relaxed">
                Investio je offline kalkulačka složeného úročení. Každý výpočet probíhá výhradně na
                tvém zařízení s čísly, která zadáš. Nic se neposílá na žádný server. Neexistuje
                žádný backend. Neexistuje žádná databáze tvých vstupů. Když aplikaci zavřeš, tvoje
                zadané hodnoty zmizí. Jediné, co si aplikace lokálně pamatuje, jsou tvoje předvolby
                zobrazení (téma a jazyk) — a jen tehdy, pokud je máš nainstalovanou.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Analytika a hlášení chyb</h2>
              <p className="text-muted-foreground leading-relaxed">
                Investio neobsahuje žádné analytické SDK ani nástroje pro hlášení chyb.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Ověření: Mobilní aplikace nepoužívá Sentry, Firebase, Amplitude, Mixpanel, AppCenter
                ani žádný ekvivalentní nástroj. Toto bylo záměrné rozhodnutí v souladu s přístupem
                aplikace, který staví soukromí na první místo. Webová verze Investio je samostatný
                produkt s vlastními zásadami ochrany osobních údajů.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Reklama a sledování</h2>
              <p className="text-muted-foreground leading-relaxed">
                V Investio nejsou žádné reklamy. Nejsou přistupovány žádné reklamní identifikátory
                (IDFA). Nedochází k žádnému sledování napříč aplikacemi nebo weby.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">
                SDK třetích stran, které odesílají data
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Žádné. Závislosti za běhu (Expo, React Native, victory-native, NativeWind) jsou
                open-source knihovny, které se spouštějí lokálně. Žádná z nich není konfigurována k
                odesílání dat kamkoli.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Požadovaná oprávnění</h2>
              <p className="text-muted-foreground leading-relaxed">
                Žádná. Investio nepožaduje žádná oprávnění zařízení: žádnou kameru, žádný mikrofon,
                žádnou polohu, žádné kontakty, žádná oznámení, žádná zdravotní data, žádný
                Bluetooth, žádné sledování.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Ochrana soukromí dětí</h2>
              <p className="text-muted-foreground leading-relaxed">
                Investio záměrně neshromažďuje data od nikoho, včetně dětí mladších 13 let. Protože
                aplikace vůbec žádná data neshromažďuje, je bezpečná pro všechny věkové skupiny
                (věkové hodnocení: 4+).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Změny těchto zásad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pokud tyto zásady kdykoli změníme — například pokud budoucí verze přidá volitelnou
                analytiku — aktualizujeme tento dokument novým datem a uživatele upozorníme v sekci
                „Co je nového" v App Store. Do té doby platí: neshromažďujeme nic.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dotazy k těmto zásadám ochrany osobních údajů:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Filip Tomanec</strong>
                </li>
                <li>
                  E-mail:{" "}
                  <a
                    href="mailto:tomanec.f@gmail.com"
                    className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                  >
                    tomanec.f@gmail.com
                  </a>
                </li>
                <li>
                  GitHub:{" "}
                  <a
                    href="https://github.com/filiptomanec/investio"
                    className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/filiptomanec/investio
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 md:px-8 py-8 border-t border-border text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Filip Tomanec</p>
      </footer>
    </div>
  );
}
