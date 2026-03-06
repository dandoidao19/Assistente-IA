-- Habilita a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Compromissos (Appointments)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    address TEXT,
    waze_link TEXT,
    note TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    task_id UUID,
    parent_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Tarefas (Tasks)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    note TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    deadline TEXT,
    reminder_time INTEGER,
    type TEXT CHECK (type IN ('standard', 'deadline')) DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Memórias (Memories)
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    folder TEXT NOT NULL,
    content TEXT,
    url TEXT,
    image_url TEXT,
    type TEXT CHECK (type IN ('text', 'link', 'image', 'video', 'contact')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Somente o dono pode ver/editar seus dados)

CREATE POLICY "Usuários podem ver seus próprios compromissos"
ON appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios compromissos"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios compromissos"
ON appointments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios compromissos"
ON appointments FOR DELETE
USING (auth.uid() = user_id);

-- Tarefas
CREATE POLICY "Usuários podem ver suas próprias tarefas"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias tarefas"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas"
ON tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias tarefas"
ON tasks FOR DELETE
USING (auth.uid() = user_id);

-- Memórias
CREATE POLICY "Usuários podem ver suas próprias memórias"
ON memories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias memórias"
ON memories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias memórias"
ON memories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias memórias"
ON memories FOR DELETE
USING (auth.uid() = user_id);
