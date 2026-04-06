-- Elimina tipos predefinidos (isSystem) que ninguna posición referencia.
-- Si aún tienes posiciones ligadas a esos IDs, el DELETE no las borra (FK) y siguen existiendo hasta que reasignes.
DELETE FROM "InvestmentTypeDefinition" AS d
WHERE d."isSystem" = true
  AND NOT EXISTS (
    SELECT 1 FROM "InvestmentPosition" p
    WHERE p."typeId" = d.id
  );
