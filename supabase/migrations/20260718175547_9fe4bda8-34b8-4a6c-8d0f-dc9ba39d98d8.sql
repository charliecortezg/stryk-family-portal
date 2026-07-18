
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS fecha_inicio date NOT NULL DEFAULT '2026-07-20';

DROP FUNCTION IF EXISTS public.get_config_publica();
CREATE FUNCTION public.get_config_publica()
 RETURNS TABLE(mes_activo text, semana_activa integer, fecha_inicio date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT mes_activo, semana_activa, fecha_inicio FROM public.config WHERE id=1;
$function$;

DROP FUNCTION IF EXISTS public.actualizar_config(text, text, integer, text, text);
CREATE FUNCTION public.actualizar_config(p_pass text, p_mes_activo text, p_semana_activa integer, p_pin_coach text, p_password_admin text, p_fecha_inicio date DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.config SET
    mes_activo = COALESCE(p_mes_activo, mes_activo),
    semana_activa = COALESCE(p_semana_activa, semana_activa),
    pin_coach = COALESCE(NULLIF(p_pin_coach,''), pin_coach),
    password_admin = COALESCE(NULLIF(p_password_admin,''), password_admin),
    fecha_inicio = COALESCE(p_fecha_inicio, fecha_inicio)
  WHERE id=1;
END;
$function$;
