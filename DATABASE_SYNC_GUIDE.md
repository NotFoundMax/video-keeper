# Guía de Sincronización de Base de Datos - Video Keeper

## Problema Identificado
El filtrado por etiquetas no funciona porque la tabla `video_tags` puede no existir en Supabase o las relaciones no están correctamente configuradas.

## Solución: Pasos para Sincronizar la Base de Datos

### Paso 1: Verificar el Estado Actual

1. Abre tu proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `migrations/diagnostic_queries.sql`
4. Ejecuta las queries para ver el estado actual

### Paso 2: Aplicar la Migración

1. En el **SQL Editor** de Supabase
2. Copia y pega el contenido de `migrations/add_video_tags_and_notes.sql`
3. Ejecuta la migración completa
4. Verifica que no haya errores

### Paso 3: Verificar la Estructura

Ejecuta esta query para confirmar que todo está correcto:

```sql
-- Verificar que video_tags existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('videos', 'tags', 'video_tags', 'folders');

-- Verificar columnas de video_tags
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'video_tags';
```

### Paso 4: Verificar Índices

```sql
-- Verificar índices creados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('video_tags', 'videos', 'tags')
ORDER BY tablename, indexname;
```

### Paso 5: Probar la Funcionalidad

1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Ve al Dashboard de la aplicación
3. Crea una etiqueta si no existe
4. Asigna la etiqueta a un video
5. Usa el filtro "Filtrar por Etiqueta"
6. Verifica que los videos se filtren correctamente

## Estructura Esperada

### Tabla `video_tags`
```sql
CREATE TABLE video_tags (
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, tag_id)
);
```

### Tabla `videos` (campo adicional)
```sql
ALTER TABLE videos ADD COLUMN notes TEXT;
```

## Comandos Útiles

### Limpiar datos de prueba (CUIDADO)
```sql
-- Solo si necesitas empezar de cero
TRUNCATE video_tags CASCADE;
```

### Ver todas las relaciones
```sql
SELECT 
    v.title as video,
    t.name as tag
FROM video_tags vt
JOIN videos v ON vt.video_id = v.id
JOIN tags t ON vt.tag_id = t.id;
```

## Troubleshooting

### Error: "relation video_tags does not exist"
**Solución:** Ejecuta la migración `add_video_tags_and_notes.sql`

### Error: "column notes does not exist"
**Solución:** Ejecuta:
```sql
ALTER TABLE videos ADD COLUMN notes TEXT;
```

### Los filtros no funcionan
**Solución:** 
1. Verifica que existan registros en `video_tags`
2. Ejecuta: `SELECT * FROM video_tags LIMIT 10;`
3. Si está vacío, asigna etiquetas a videos desde la UI

### Las etiquetas no se guardan
**Solución:**
1. Verifica las foreign keys:
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'video_tags';
```

## Verificación Final

Después de aplicar la migración, ejecuta:

```sql
-- Debe retornar TRUE
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'video_tags'
);

-- Debe retornar 2 (video_id y tag_id)
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'video_tags';

-- Debe retornar TRUE
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'videos' 
    AND column_name = 'notes'
);
```

Si todas las queries retornan los valores esperados, la base de datos está correctamente sincronizada.

## Siguiente Paso

Una vez sincronizada la base de datos:
1. Reinicia el servidor (`npm run dev`)
2. Prueba crear etiquetas
3. Asigna etiquetas a videos
4. Usa el filtro por etiquetas
5. Verifica que funcione correctamente

---

**Nota:** Guarda este archivo para futuras referencias o si necesitas configurar la base de datos en otro entorno.
