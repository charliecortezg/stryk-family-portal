CREATE OR REPLACE FUNCTION public.cambiar_semana(p_pin text, p_semana int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.verificar_pin(p_pin) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_semana NOT BETWEEN 1 AND 4 THEN
    RAISE EXCEPTION 'Semana inválida';
  END IF;
  UPDATE public.config SET semana_activa = p_semana WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cambiar_semana(text, int) TO anon, authenticated;