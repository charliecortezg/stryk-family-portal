
-- ============================================================
-- STRYK — White Lions Academy — Esquema inicial
-- ============================================================

-- Tabla: config (fila única id=1)
CREATE TABLE public.config (
  id int PRIMARY KEY DEFAULT 1,
  pin_coach text NOT NULL DEFAULT '2026',
  password_admin text NOT NULL DEFAULT 'wl2026admin',
  mes_activo text NOT NULL DEFAULT 'julio',
  semana_activa int NOT NULL DEFAULT 1,
  CONSTRAINT config_singleton CHECK (id = 1)
);
GRANT ALL ON public.config TO service_role;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.config (id) VALUES (1);

-- Tabla: jugadores
CREATE TABLE public.jugadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  grupo text NOT NULL CHECK (grupo IN ('A','B')),
  mes text NOT NULL CHECK (mes IN ('junio','julio','agosto')),
  codigo_familia text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.jugadores TO service_role;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;

-- Tabla: evaluaciones_diarias
CREATE TABLE public.evaluaciones_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  semana int NOT NULL CHECK (semana BETWEEN 1 AND 4),
  asistencia text NOT NULL CHECK (asistencia IN ('puntual','tardanza','ausente')),
  esfuerzo int CHECK (esfuerzo BETWEEN 1 AND 5),
  aplicacion_tactica int CHECK (aplicacion_tactica BETWEEN 1 AND 5),
  trabajo_equipo int CHECK (trabajo_equipo BETWEEN 1 AND 5),
  comunicacion int CHECK (comunicacion BETWEEN 1 AND 5),
  nota_coach text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jugador_id, fecha)
);
GRANT ALL ON public.evaluaciones_diarias TO service_role;
ALTER TABLE public.evaluaciones_diarias ENABLE ROW LEVEL SECURITY;

-- Tabla: evaluaciones_tecnicas
CREATE TABLE public.evaluaciones_tecnicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  semana int NOT NULL CHECK (semana BETWEEN 1 AND 4),
  indicador text NOT NULL CHECK (indicador IN ('conduccion','pase','recepcion','control_aereo','remate')),
  valor int NOT NULL CHECK (valor BETWEEN 1 AND 5),
  nota text,
  fecha date NOT NULL,
  UNIQUE (jugador_id, semana, indicador)
);
GRANT ALL ON public.evaluaciones_tecnicas TO service_role;
ALTER TABLE public.evaluaciones_tecnicas ENABLE ROW LEVEL SECURITY;

-- Tabla: logros
CREATE TABLE public.logros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  logro_codigo text NOT NULL,
  desbloqueado boolean NOT NULL DEFAULT false,
  fecha_desbloqueo timestamptz,
  UNIQUE (jugador_id, logro_codigo)
);
GRANT ALL ON public.logros TO service_role;
ALTER TABLE public.logros ENABLE ROW LEVEL SECURITY;

-- Tabla: fotos_semanales
CREATE TABLE public.fotos_semanales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo text NOT NULL CHECK (grupo IN ('A','B')),
  mes text NOT NULL,
  semana int NOT NULL CHECK (semana BETWEEN 1 AND 4),
  imagen_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.fotos_semanales TO service_role;
ALTER TABLE public.fotos_semanales ENABLE ROW LEVEL SECURITY;

-- Tabla: reportes
CREATE TABLE public.reportes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL UNIQUE REFERENCES public.jugadores(id) ON DELETE CASCADE,
  mensaje_coach text NOT NULL DEFAULT '',
  publicado boolean NOT NULL DEFAULT false,
  fecha_publicacion timestamptz
);
GRANT ALL ON public.reportes TO service_role;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: generar código de familia (6 chars sin O,0,I,1,L)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generar_codigo_familia()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  charset text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  exists_flag boolean;
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(charset, (floor(random()*length(charset))+1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.jugadores WHERE codigo_familia = code) INTO exists_flag;
    EXIT WHEN NOT exists_flag;
  END LOOP;
  RETURN code;
END;
$$;

-- ============================================================
-- Trigger: al crear jugador, sembrar 16 logros
-- ============================================================
CREATE OR REPLACE FUNCTION public.sembrar_logros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codigos text[] := ARRAY[
    'slalom_no_dominante','control_orientado','dos_v_uno','torneo_rondos',
    'pase_preciso','control_pecho','pared','gol_empeine',
    'inside_cut','outside_cut','uno_v_uno_of','uno_v_uno_def',
    'pressing_activado','pressing_banda','tercer_hombre','mini_copa'
  ];
  c text;
BEGIN
  FOREACH c IN ARRAY codigos LOOP
    INSERT INTO public.logros (jugador_id, logro_codigo) VALUES (NEW.id, c);
  END LOOP;
  INSERT INTO public.reportes (jugador_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sembrar_logros
AFTER INSERT ON public.jugadores
FOR EACH ROW EXECUTE FUNCTION public.sembrar_logros();

-- ============================================================
-- RPCs de acceso (SECURITY DEFINER)
-- ============================================================

-- Validación PIN coach
CREATE OR REPLACE FUNCTION public.verificar_pin(p_pin text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.config WHERE id=1 AND pin_coach = p_pin);
$$;

-- Validación admin
CREATE OR REPLACE FUNCTION public.verificar_admin(p_pass text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.config WHERE id=1 AND password_admin = p_pass);
$$;

-- Obtener config pública (mes/semana activa) — sin secretos
CREATE OR REPLACE FUNCTION public.get_config_publica()
RETURNS TABLE(mes_activo text, semana_activa int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mes_activo, semana_activa FROM public.config WHERE id=1;
$$;

-- Obtener config completa (coach/admin)
CREATE OR REPLACE FUNCTION public.get_config(p_pin text)
RETURNS SETOF public.config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (EXISTS(SELECT 1 FROM public.config WHERE id=1 AND (pin_coach=p_pin OR password_admin=p_pin))) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  RETURN QUERY SELECT * FROM public.config WHERE id=1;
END;
$$;

-- Listar jugadores (coach/admin)
CREATE OR REPLACE FUNCTION public.listar_jugadores(p_pin text, p_grupo text DEFAULT NULL, p_mes text DEFAULT NULL, p_solo_activos boolean DEFAULT false)
RETURNS SETOF public.jugadores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (EXISTS(SELECT 1 FROM public.config WHERE id=1 AND (pin_coach=p_pin OR password_admin=p_pin))) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  RETURN QUERY
    SELECT * FROM public.jugadores
    WHERE (p_grupo IS NULL OR grupo=p_grupo)
      AND (p_mes IS NULL OR mes=p_mes)
      AND (NOT p_solo_activos OR activo)
    ORDER BY nombre;
END;
$$;

-- Crear jugador (admin)
CREATE OR REPLACE FUNCTION public.crear_jugador(p_pass text, p_nombre text, p_grupo text, p_mes text)
RETURNS public.jugadores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nuevo public.jugadores;
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO public.jugadores (nombre, grupo, mes, codigo_familia)
  VALUES (trim(p_nombre), p_grupo, p_mes, public.generar_codigo_familia())
  RETURNING * INTO nuevo;
  RETURN nuevo;
END;
$$;

-- Activar/desactivar
CREATE OR REPLACE FUNCTION public.set_activo(p_pass text, p_jugador uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.jugadores SET activo=p_activo WHERE id=p_jugador;
END;
$$;

-- Guardar asistencia (coach) — upsert; borra ratings si ausente
CREATE OR REPLACE FUNCTION public.registrar_asistencia(
  p_pin text, p_jugador uuid, p_fecha date, p_semana int, p_asistencia text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO public.evaluaciones_diarias (jugador_id, fecha, semana, asistencia)
  VALUES (p_jugador, p_fecha, p_semana, p_asistencia)
  ON CONFLICT (jugador_id, fecha)
  DO UPDATE SET asistencia = EXCLUDED.asistencia, semana = EXCLUDED.semana;
END;
$$;

-- Guardar evaluación diaria completa (coach)
CREATE OR REPLACE FUNCTION public.guardar_evaluacion_diaria(
  p_pin text, p_jugador uuid, p_fecha date, p_semana int,
  p_esfuerzo int, p_tactica int, p_equipo int, p_comunicacion int, p_nota text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO public.evaluaciones_diarias
    (jugador_id, fecha, semana, asistencia, esfuerzo, aplicacion_tactica, trabajo_equipo, comunicacion, nota_coach)
  VALUES (p_jugador, p_fecha, p_semana, 'puntual', p_esfuerzo, p_tactica, p_equipo, p_comunicacion, p_nota)
  ON CONFLICT (jugador_id, fecha) DO UPDATE SET
    semana=EXCLUDED.semana,
    esfuerzo=EXCLUDED.esfuerzo,
    aplicacion_tactica=EXCLUDED.aplicacion_tactica,
    trabajo_equipo=EXCLUDED.trabajo_equipo,
    comunicacion=EXCLUDED.comunicacion,
    nota_coach=EXCLUDED.nota_coach,
    asistencia = CASE WHEN public.evaluaciones_diarias.asistencia='ausente' THEN 'puntual' ELSE public.evaluaciones_diarias.asistencia END;
END;
$$;

-- Guardar evaluación técnica
CREATE OR REPLACE FUNCTION public.guardar_evaluacion_tecnica(
  p_pin text, p_jugador uuid, p_semana int, p_indicador text, p_valor int, p_nota text, p_fecha date
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO public.evaluaciones_tecnicas (jugador_id, semana, indicador, valor, nota, fecha)
  VALUES (p_jugador, p_semana, p_indicador, p_valor, p_nota, p_fecha)
  ON CONFLICT (jugador_id, semana, indicador)
  DO UPDATE SET valor=EXCLUDED.valor, nota=EXCLUDED.nota, fecha=EXCLUDED.fecha;
END;
$$;

-- Listar evaluaciones del día para un grupo (coach)
CREATE OR REPLACE FUNCTION public.listar_evaluaciones_dia(p_pin text, p_grupo text, p_mes text, p_fecha date)
RETURNS TABLE(
  jugador_id uuid, nombre text,
  asistencia text, esfuerzo int, aplicacion_tactica int, trabajo_equipo int, comunicacion int, nota_coach text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
    SELECT j.id, j.nombre, e.asistencia, e.esfuerzo, e.aplicacion_tactica, e.trabajo_equipo, e.comunicacion, e.nota_coach
    FROM public.jugadores j
    LEFT JOIN public.evaluaciones_diarias e
      ON e.jugador_id = j.id AND e.fecha = p_fecha
    WHERE j.grupo = p_grupo AND j.mes = p_mes AND j.activo
    ORDER BY j.nombre;
END;
$$;

-- Semáforo (admin)
CREATE OR REPLACE FUNCTION public.semaforo(p_pass text, p_grupo text, p_mes text, p_semana int)
RETURNS TABLE(jugador_id uuid, nombre text, fecha date, asistencia text, completo boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
    SELECT j.id, j.nombre, e.fecha, e.asistencia,
      (e.esfuerzo IS NOT NULL AND e.aplicacion_tactica IS NOT NULL AND e.trabajo_equipo IS NOT NULL AND e.comunicacion IS NOT NULL) AS completo
    FROM public.jugadores j
    LEFT JOIN public.evaluaciones_diarias e ON e.jugador_id=j.id AND e.semana=p_semana
    WHERE j.grupo=p_grupo AND j.mes=p_mes
    ORDER BY j.nombre, e.fecha;
END;
$$;

-- Toggle logro
CREATE OR REPLACE FUNCTION public.toggle_logro(p_pass text, p_jugador uuid, p_codigo text, p_valor boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.logros
    SET desbloqueado=p_valor,
        fecha_desbloqueo = CASE WHEN p_valor THEN now() ELSE NULL END
    WHERE jugador_id=p_jugador AND logro_codigo=p_codigo;
END;
$$;

-- Desbloquear toda la semana
CREATE OR REPLACE FUNCTION public.desbloquear_semana(p_pass text, p_jugador uuid, p_semana int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  codigos text[];
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  codigos := CASE p_semana
    WHEN 1 THEN ARRAY['slalom_no_dominante','control_orientado','dos_v_uno','torneo_rondos']
    WHEN 2 THEN ARRAY['pase_preciso','control_pecho','pared','gol_empeine']
    WHEN 3 THEN ARRAY['inside_cut','outside_cut','uno_v_uno_of','uno_v_uno_def']
    WHEN 4 THEN ARRAY['pressing_activado','pressing_banda','tercer_hombre','mini_copa']
  END;
  UPDATE public.logros
    SET desbloqueado=true, fecha_desbloqueo=now()
    WHERE jugador_id=p_jugador AND logro_codigo = ANY(codigos);
END;
$$;

-- Listar logros de un jugador (admin/coach)
CREATE OR REPLACE FUNCTION public.listar_logros(p_pin text, p_jugador uuid)
RETURNS SETOF public.logros
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (EXISTS(SELECT 1 FROM public.config WHERE id=1 AND (pin_coach=p_pin OR password_admin=p_pin))) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  RETURN QUERY SELECT * FROM public.logros WHERE jugador_id=p_jugador ORDER BY logro_codigo;
END;
$$;

-- Guardar mensaje y publicar reporte
CREATE OR REPLACE FUNCTION public.guardar_reporte(p_pass text, p_jugador uuid, p_mensaje text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.reportes SET mensaje_coach=p_mensaje WHERE jugador_id=p_jugador;
END;
$$;

CREATE OR REPLACE FUNCTION public.publicar_reporte(p_pass text, p_jugador uuid, p_publicado boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.reportes SET
    publicado=p_publicado,
    fecha_publicacion = CASE WHEN p_publicado THEN now() ELSE NULL END
    WHERE jugador_id=p_jugador;
END;
$$;

CREATE OR REPLACE FUNCTION public.publicar_grupo(p_pass text, p_grupo text, p_mes text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.reportes SET publicado=true, fecha_publicacion=now()
    WHERE jugador_id IN (SELECT id FROM public.jugadores WHERE grupo=p_grupo AND mes=p_mes);
END;
$$;

-- Obtener reporte del jugador (admin)
CREATE OR REPLACE FUNCTION public.get_reporte(p_pass text, p_jugador uuid)
RETURNS SETOF public.reportes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.reportes WHERE jugador_id=p_jugador;
END;
$$;

-- Subir foto
CREATE OR REPLACE FUNCTION public.subir_foto(p_pass text, p_grupo text, p_mes text, p_semana int, p_url text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  INSERT INTO public.fotos_semanales (grupo, mes, semana, imagen_url)
  VALUES (p_grupo, p_mes, p_semana, p_url);
END;
$$;

-- Actualizar config
CREATE OR REPLACE FUNCTION public.actualizar_config(
  p_pass text, p_mes_activo text, p_semana_activa int, p_pin_coach text, p_password_admin text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.config SET
    mes_activo = COALESCE(p_mes_activo, mes_activo),
    semana_activa = COALESCE(p_semana_activa, semana_activa),
    pin_coach = COALESCE(NULLIF(p_pin_coach,''), pin_coach),
    password_admin = COALESCE(NULLIF(p_password_admin,''), password_admin)
  WHERE id=1;
END;
$$;

-- Datos completos del portal familia por código
CREATE OR REPLACE FUNCTION public.get_portal_data(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  j public.jugadores;
  result jsonb;
  reporte public.reportes;
  ultima_foto public.fotos_semanales;
BEGIN
  SELECT * INTO j FROM public.jugadores WHERE codigo_familia=upper(p_codigo) AND activo;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO reporte FROM public.reportes WHERE jugador_id=j.id;
  SELECT * INTO ultima_foto FROM public.fotos_semanales
    WHERE grupo=j.grupo AND mes=j.mes ORDER BY semana DESC, created_at DESC LIMIT 1;

  result := jsonb_build_object(
    'jugador', jsonb_build_object('id',j.id,'nombre',j.nombre,'grupo',j.grupo,'mes',j.mes),
    'config', (SELECT to_jsonb(c) - 'pin_coach' - 'password_admin' FROM public.config c WHERE id=1),
    'diarias', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'fecha', e.fecha, 'semana', e.semana, 'asistencia', e.asistencia,
        'esfuerzo', e.esfuerzo, 'aplicacion_tactica', e.aplicacion_tactica,
        'trabajo_equipo', e.trabajo_equipo, 'comunicacion', e.comunicacion
      ) ORDER BY e.fecha) FROM public.evaluaciones_diarias e WHERE e.jugador_id=j.id
    ), '[]'::jsonb),
    'tecnicas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'semana', t.semana, 'indicador', t.indicador, 'valor', t.valor, 'fecha', t.fecha
      ) ORDER BY t.semana, t.indicador) FROM public.evaluaciones_tecnicas t WHERE t.jugador_id=j.id
    ), '[]'::jsonb),
    'logros', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'codigo', l.logro_codigo, 'desbloqueado', l.desbloqueado, 'fecha_desbloqueo', l.fecha_desbloqueo
      )) FROM public.logros l WHERE l.jugador_id=j.id
    ), '[]'::jsonb),
    'foto', CASE WHEN ultima_foto.id IS NOT NULL THEN
      jsonb_build_object('url', ultima_foto.imagen_url, 'semana', ultima_foto.semana) ELSE NULL END,
    'reporte', CASE WHEN reporte.publicado THEN
      jsonb_build_object('mensaje', reporte.mensaje_coach, 'fecha', reporte.fecha_publicacion)
      ELSE NULL END
  );
  RETURN result;
END;
$$;

-- ============================================================
-- Permisos EXECUTE para anon (todo el acceso pasa por RPCs)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.verificar_pin(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_admin(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_config_publica() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_config(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_jugadores(text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_jugador(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_activo(text, uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_asistencia(text, uuid, date, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_evaluacion_diaria(text, uuid, date, int, int, int, int, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_evaluacion_tecnica(text, uuid, int, text, int, text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_evaluaciones_dia(text, text, text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.semaforo(text, text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_logro(text, uuid, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.desbloquear_semana(text, uuid, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_logros(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_reporte(text, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_reporte(text, uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_grupo(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reporte(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subir_foto(text, text, text, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_config(text, text, int, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_data(text) TO anon, authenticated;
