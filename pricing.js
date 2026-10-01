// Valores em centavos, transcritos da tabela fornecida pela equipe Ovis.
// Os limites 250* e 500* são interpretados como faixas até esses números;
// asteriscos sem legenda exigem validação comercial antes da contratação.
export const TIERS = [
  { max: 30, label: 'Até 30 ovinos', plans: [[25990, 265098, 22092], [30990, 316098, 26342], [35990, 367098, 30592]] },
  { max: 50, label: '31–50 ovinos', plans: [[29990, 305898, 25492], [34990, 356898, 29742], [39990, 407898, 33992]] },
  { max: 100, label: '51–100 ovinos', plans: [[34990, 356898, 29742], [39990, 407898, 33992], [44990, 458898, 38242]] },
  { max: 250, label: '101–250 ovinos*', plans: [[54990, 560898, 46742], [59990, 611898, 50992], [64990, 662898, 55242]] },
  { max: 500, label: '251–500 ovinos*', plans: [[99990, 1019898, 84992], [104990, 1070898, 89242], [109990, 1121898, 93492]] },
];
export const PLAN_NAMES = ['Basic', 'Plus', 'Pro'];

export function tierFor(count) {
  if (!Number.isInteger(count) || count < 1) return null;
  return TIERS.find((tier) => count <= tier.max) ?? null;
}

export function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
