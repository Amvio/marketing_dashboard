/*
  # Update Library Table to Use Integer IDs

  1. Changes
    - Drop existing library table
    - Recreate library table with integer ID (1-14)
    - Insert all metric descriptions with corresponding IDs matching the metric order

  2. Data
    - 14 entries total, one for each metric box
    - IDs match the order: impressions(1), clicks(2), spend(3), reach(4), ctr(5), cpm(6), frequency(7), cpc(8), leads(9), qualified-leads(10), cost-per-lead(11), conversion-rate(12), lead-quality(13), follow-up-rate(14)

  3. Security
    - Enable RLS on `library` table
    - Add policy for authenticated users to read all library entries
*/

DROP TABLE IF EXISTS library CASCADE;

CREATE TABLE library (
  id integer PRIMARY KEY,
  title text NOT NULL,
  description text,
  date_changed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all library entries"
  ON library
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert library entries"
  ON library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update library entries"
  ON library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete library entries"
  ON library
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO library (id, title, description) VALUES
(1, 'Impressionen', 'Impressionen zeigen die Gesamtzahl der Anzeigenaufrufe. Dieser Wert gibt an, wie oft Ihre Anzeige auf Bildschirmen angezeigt wurde. Eine hohe Impressionenzahl bedeutet eine breite Sichtbarkeit Ihrer Kampagne.'),
(2, 'Klicks', 'Klicks messen, wie oft Nutzer auf Ihre Anzeige geklickt haben. Diese Metrik zeigt das direkte Interesse und Engagement der Zielgruppe. Mehr Klicks bedeuten eine höhere Interaktion mit Ihrem Werbematerial.'),
(3, 'Ausgaben (€)', 'Ausgaben zeigen die Gesamtkosten Ihrer Werbekampagne in Euro. Dieser Betrag umfasst alle Kosten für Anzeigenschaltungen im ausgewählten Zeitraum. Die Ausgaben helfen bei der Budgetkontrolle und ROI-Berechnung.'),
(4, 'Reichweite', 'Reichweite gibt an, wie viele eindeutige Personen Ihre Anzeige gesehen haben. Im Gegensatz zu Impressionen zählt jeder Nutzer nur einmal. Eine hohe Reichweite bedeutet, dass Sie viele verschiedene Menschen erreichen.'),
(5, 'CTR (%)', 'Die Click-Through-Rate zeigt das Verhältnis von Klicks zu Impressionen in Prozent. Sie misst die Effektivität Ihrer Anzeige bei der Generierung von Interesse. Eine höhere CTR deutet auf relevantere und ansprechendere Werbeinhalte hin.'),
(6, 'CPM (€)', 'CPM steht für Cost per Mille und zeigt die Kosten pro 1.000 Impressionen. Diese Metrik hilft bei der Bewertung der Effizienz Ihrer Werbeausgaben. Ein niedrigerer CPM bedeutet kostengünstigere Sichtbarkeit.'),
(7, 'Frequenz', 'Frequenz misst, wie oft durchschnittlich jede Person Ihre Anzeige gesehen hat. Sie wird berechnet aus Impressionen geteilt durch Reichweite. Eine optimale Frequenz sorgt für Wiedererkennungswert ohne Überexposition.'),
(8, 'CPC (€)', 'CPC steht für Cost per Click und zeigt die durchschnittlichen Kosten pro Klick. Diese Metrik hilft bei der Bewertung der Effizienz Ihrer Klickgenerierung. Ein niedrigerer CPC bedeutet kostengünstigere Nutzerinteraktionen.'),
(9, 'Leads', 'Leads zeigen die Anzahl der generierten Kontakte oder Interessenten. Diese Metrik misst, wie viele Personen Interesse an Ihrem Angebot bekundet haben. Mehr Leads bedeuten mehr potenzielle Kunden für Ihr Unternehmen.'),
(10, 'Qualifizierte Leads', 'Qualifizierte Leads sind Kontakte, die bestimmte Kriterien für potenzielle Kunden erfüllen. Sie haben höhere Chancen auf eine Konversion als normale Leads. Diese Metrik zeigt die Qualität Ihrer Lead-Generierung.'),
(11, 'Kosten pro Lead', 'Kosten pro Lead zeigen die durchschnittlichen Ausgaben für jeden generierten Kontakt. Diese Metrik hilft bei der Bewertung der Effizienz Ihrer Lead-Generierung. Niedrigere Kosten pro Lead bedeuten bessere Kampagneneffizienz.'),
(12, 'Conversion Rate (%)', 'Die Conversion Rate zeigt den Prozentsatz der Nutzer, die eine gewünschte Aktion durchgeführt haben. Sie misst die Effektivität Ihrer Kampagne bei der Zielerreichung. Eine höhere Conversion Rate bedeutet bessere Kampagnenperformance.'),
(13, 'Lead Qualität', 'Lead Qualität bewertet, wie gut die generierten Leads zu Ihrem Zielkundenprofil passen. Diese Metrik hilft bei der Bewertung der Relevanz Ihrer Targeting-Strategie. Höhere Lead Qualität führt zu besseren Verkaufschancen.'),
(14, 'Follow-up Rate (%)', 'Die Follow-up Rate zeigt den Prozentsatz der Leads, die weiterverfolgt wurden. Sie misst die Effizienz Ihres Nachfolgeprozesses nach der Lead-Generierung. Eine höhere Rate bedeutet bessere Nutzung der generierten Kontakte.');