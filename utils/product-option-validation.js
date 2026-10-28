function normalizeProductOptionInput(input) {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const nombre = String(data.nombre ?? '').trim();
  const precio = Number(data.precio);

  if (!nombre || nombre.length > 120) {
    return { value: null, error: 'El nombre de la bebida es obligatorio y no puede superar 120 caracteres.' };
  }
  if (!Number.isFinite(precio) || precio <= 0 || precio > 99999999.99) {
    return { value: null, error: 'El precio de la bebida debe ser un número mayor que cero.' };
  }

  return { value: { nombre, precio }, error: null };
}

module.exports = { normalizeProductOptionInput };
