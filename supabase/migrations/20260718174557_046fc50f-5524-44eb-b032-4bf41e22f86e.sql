ALTER TABLE public.jugadores DROP CONSTRAINT IF EXISTS jugadores_grupo_check;

CREATE OR REPLACE FUNCTION public.semaforo(p_pass text, p_grupo text, p_mes text, p_semana integer)
 RETURNS TABLE(jugador_id uuid, nombre text, fecha date, asistencia text, completo boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.verificar_admin(p_pass) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
    SELECT j.id, j.nombre, e.fecha, e.asistencia,
      (e.esfuerzo IS NOT NULL AND e.aplicacion_tactica IS NOT NULL AND e.trabajo_equipo IS NOT NULL AND e.comunicacion IS NOT NULL) AS completo
    FROM public.jugadores j
    LEFT JOIN public.evaluaciones_diarias e ON e.jugador_id=j.id AND e.semana=p_semana
    WHERE (p_grupo IS NULL OR j.grupo=p_grupo) AND j.mes=p_mes
    ORDER BY j.nombre, e.fecha;
END;
$function$;