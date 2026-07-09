
CREATE OR REPLACE FUNCTION public.historial_jugador_coach(p_pin text, p_jugador uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN jsonb_build_object(
    'diarias', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'fecha', e.fecha, 'semana', e.semana, 'asistencia', e.asistencia,
      'esfuerzo', e.esfuerzo, 'aplicacion_tactica', e.aplicacion_tactica,
      'trabajo_equipo', e.trabajo_equipo, 'comunicacion', e.comunicacion,
      'nota_coach', e.nota_coach) ORDER BY e.fecha)
      FROM public.evaluaciones_diarias e WHERE e.jugador_id = p_jugador), '[]'::jsonb),
    'tecnicas', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'semana', t.semana, 'indicador', t.indicador, 'valor', t.valor) ORDER BY t.semana, t.indicador)
      FROM public.evaluaciones_tecnicas t WHERE t.jugador_id = p_jugador), '[]'::jsonb)
  );
END;
$$;
