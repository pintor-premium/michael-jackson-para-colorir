-- ==========================================
-- SCHEMA SQL PARA MIGRAÇÃO FUTURA NO SUPABASE
-- ==========================================

-- Habilitar extensões úteis se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    child_name TEXT DEFAULT 'João Gabriel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar o próprio perfil" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem editar o próprio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 2. TABELA DE PINTURAS E PROGRESSO
CREATE TABLE IF NOT EXISTS public.paintings (
    id TEXT PRIMARY KEY, -- ID único (ex: 'silhouette_1_1723790123')
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    drawing_id TEXT NOT NULL, -- ID do desenho base (ex: 'silhouette_1')
    title TEXT NOT NULL, -- Título customizado (ex: 'Minha Jaqueta Vermelha')
    canvas_data TEXT NOT NULL, -- Imagem pintada em Base64 (Data URL)
    progress INTEGER DEFAULT 0 NOT NULL, -- Porcentagem concluída (0 a 100)
    is_favorite INTEGER DEFAULT 0 NOT NULL, -- 0 ou 1
    is_completed INTEGER DEFAULT 0 NOT NULL, -- 0 ou 1
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para otimização de busca de pinturas
CREATE INDEX IF NOT EXISTS idx_paintings_user_id ON public.paintings(user_id);
CREATE INDEX IF NOT EXISTS idx_paintings_drawing_id ON public.paintings(drawing_id);

-- Habilitar RLS para Pinturas
ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas próprias pinturas" 
    ON public.paintings FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 3. TABELA DE CONQUISTAS DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT NOT NULL, -- Código da conquista (ex: 'first_painting')
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    unlocked INTEGER DEFAULT 0 NOT NULL, -- 0 ou 1
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0 NOT NULL, -- Progresso atual (ex: 3 de 5)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id, user_id)
);

-- Habilitar RLS para Conquistas
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas próprias conquistas" 
    ON public.achievements FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 4. TABELA DE CONFIGURAÇÕES DE PREFERÊNCIAS
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT NOT NULL, -- Chave da configuração
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    value JSONB NOT NULL, -- Valor estruturado em JSON
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (key, user_id)
);

-- Habilitar RLS para Configurações
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas próprias configurações" 
    ON public.settings FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- GATILHOS (TRIGGERS) PARA ATUALIZAR TIMESTAMP
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profiles_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_paintings_update
    BEFORE UPDATE ON public.paintings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_achievements_update
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_settings_update
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Gatilho automático para criar o perfil ao cadastrar na tabela auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, child_name)
    VALUES (NEW.id, 'João Gabriel');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
