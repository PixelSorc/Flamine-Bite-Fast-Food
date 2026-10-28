function normalizeProductInput(input) {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const codigo = String(data.codigo ?? '').trim();
  const nombre = String(data.nombre ?? '').trim();
  const descripcion = String(data.descripcion ?? '').trim();
  const precio = Number(data.precio);
  const imagen = String(data.imagen ?? '').trim();
  const categoriaRaw = data.categoria_id;
  const categoria_id = categoriaRaw === '' || categoriaRaw === undefined || categoriaRaw === null
    ? null
    : Number(categoriaRaw);

  if (!/^[A-Za-z0-9-]{1,20}$/.test(codigo)) {
    return { value: null, error: 'El código debe tener entre 1 y 20 letras, números o guiones.' };
  }
  if (!nombre || nombre.length > 120) {
    return { value: null, error: 'El nombre es obligatorio y no puede superar 120 caracteres.' };
  }
  if (!Number.isFinite(precio) || precio <= 0 || precio > 99999999.99) {
    return { value: null, error: 'El precio debe ser un número mayor que cero.' };
  }
  if (descripcion.length > 20000) {
    return { value: null, error: 'La descripción no puede superar 20.000 caracteres.' };
  }
  if (imagen.length > 255) {
    return { value: null, error: 'La ruta de la imagen no puede superar 255 caracteres.' };
  }
  if (categoria_id !== null && (!Number.isSafeInteger(categoria_id) || categoria_id < 1)) {
    return { value: null, error: 'La categoría seleccionada no es válida.' };
  }

  return {
    value: { codigo, nombre, descripcion, precio, imagen, categoria_id },
    error: null,
  };
}

module.exports = { normalizeProductInput };
