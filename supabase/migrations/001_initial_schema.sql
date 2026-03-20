-- Services Marketplace - Initial Schema

-- Categories of services
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service professionals
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id),

  -- Contact
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  neighborhood TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius_km INTEGER DEFAULT 20,

  -- Google Maps import
  google_place_id TEXT UNIQUE,
  google_place_name TEXT,
  google_rating NUMERIC(2,1),
  google_review_count INTEGER DEFAULT 0,
  google_url TEXT,
  source TEXT DEFAULT 'google_maps' CHECK (source IN ('google_maps', 'manual', 'claimed')),

  -- Platform data
  platform_rating NUMERIC(2,1),
  platform_review_count INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_by UUID,
  claimed_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  tier TEXT DEFAULT 'imported' CHECK (tier IN ('imported', 'claimed', 'verified', 'expert', 'master')),

  -- Profile
  description TEXT,
  years_experience INTEGER,
  hours TEXT,
  profile_photo_url TEXT,

  -- Meta
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews imported from Google
CREATE TABLE reviews_imported (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'google_maps',
  source_review_id TEXT,
  author_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  review_date TEXT, -- stored as original text like "2 meses atrás"
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(professional_id, source_review_id)
);

-- Platform-native reviews (from actual jobs)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  client_id UUID,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  photos TEXT[], -- URLs
  is_verified_job BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service specialties (e.g., "instalação elétrica", "caça vazamento")
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(category_id, slug)
);

-- Junction: professional <-> specialties
CREATE TABLE professional_specialties (
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, specialty_id)
);

-- Photos / portfolio
CREATE TABLE professional_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  source TEXT DEFAULT 'google_maps',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_professionals_category ON professionals(category_id);
CREATE INDEX idx_professionals_city ON professionals(city);
CREATE INDEX idx_professionals_location ON professionals(latitude, longitude);
CREATE INDEX idx_professionals_rating ON professionals(google_rating DESC NULLS LAST);
CREATE INDEX idx_professionals_claimed ON professionals(is_claimed);
CREATE INDEX idx_professionals_active ON professionals(is_active);
CREATE INDEX idx_reviews_imported_professional ON reviews_imported(professional_id);
CREATE INDEX idx_reviews_professional ON reviews(professional_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Eletricista', 'eletricista', 'zap'),
  ('Encanador', 'encanador', 'droplets'),
  ('Pedreiro', 'pedreiro', 'brick-wall'),
  ('Pintor', 'pintor', 'paintbrush'),
  ('Diarista', 'diarista', 'sparkles'),
  ('Montador de Móveis', 'montador-de-moveis', 'sofa'),
  ('Mudanças e Carretos', 'mudancas-e-carretos', 'truck'),
  ('Ar Condicionado', 'ar-condicionado', 'thermometer-snowflake'),
  ('Serralheiro', 'serralheiro', 'shield'),
  ('Jardineiro', 'jardineiro', 'tree-palm');

-- Seed electrician specialties
INSERT INTO specialties (category_id, name, slug)
SELECT id, unnest(ARRAY[
  'Instalação Elétrica',
  'Manutenção e Reparo',
  'Instalação de Ar Condicionado',
  'Quadro de Distribuição',
  'Iluminação',
  'Tomadas e Interruptores',
  'Fiação',
  'Curto Circuito',
  'Disjuntor',
  'Chuveiro Elétrico'
]),
unnest(ARRAY[
  'instalacao-eletrica',
  'manutencao-e-reparo',
  'instalacao-de-ar-condicionado',
  'quadro-de-distribuicao',
  'iluminacao',
  'tomadas-e-interruptores',
  'fiacao',
  'curto-circuito',
  'disjuntor',
  'chuveiro-eletrico'
])
FROM categories WHERE slug = 'eletricista';
