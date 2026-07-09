
-- Permitir p_grupo NULL en listar_evaluaciones_dia (todos los grupos del mes)
CREATE OR REPLACE FUNCTION public.listar_evaluaciones_dia(p_pin text, p_grupo text, p_mes text, p_fecha date)
 RETURNS TABLE(jugador_id uuid, nombre text, asistencia text, esfuerzo integer, aplicacion_tactica integer, trabajo_equipo integer, comunicacion integer, nota_coach text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
    SELECT j.id, j.nombre, e.asistencia, e.esfuerzo, e.aplicacion_tactica, e.trabajo_equipo, e.comunicacion, e.nota_coach
    FROM public.jugadores j
    LEFT JOIN public.evaluaciones_diarias e
      ON e.jugador_id = j.id AND e.fecha = p_fecha
    WHERE (p_grupo IS NULL OR j.grupo = p_grupo) AND j.mes = p_mes AND j.activo
    ORDER BY j.nombre;
END;
$function$;

-- Logros: RPCs accesibles desde coach por PIN
CREATE OR REPLACE FUNCTION public.toggle_logro_coach(p_pin text, p_jugador uuid, p_codigo text, p_valor boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.logros
    SET desbloqueado = p_valor,
        fecha_desbloqueo = CASE WHEN p_valor THEN now() ELSE NULL END
    WHERE jugador_id = p_jugador AND logro_codigo = p_codigo;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_logros_coach(p_pin text, p_jugador uuid)
RETURNS SETOF public.logros
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.logros WHERE jugador_id = p_jugador ORDER BY logro_codigo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_logro_coach(text, uuid, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_logros_coach(text, uuid) TO anon, authenticated;
