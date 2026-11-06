-- Move the role helper out of the exposed public API.
-- RLS policies continue to reference the same function OID after ALTER FUNCTION SET SCHEMA.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER FUNCTION public.has_role(uuid, public.app_role)
  SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
