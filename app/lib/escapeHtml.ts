// Escapa texto ingresado por el usuario antes de insertarlo en el HTML de los informes PDF
export const escapeHtml = (valor: any) => String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any
)[c]);
