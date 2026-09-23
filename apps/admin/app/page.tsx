const routes = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Produtos" },
  { href: "/orders", label: "Pedidos" },
  { href: "/generations", label: "Gerações" },
  { href: "/users", label: "Usuários" },
  { href: "/settings", label: "Configurações" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">FotoZap IA — Admin</h1>
      <p className="mt-3 text-slate-300">
        Esqueleto do painel. Autenticação, dados reais e filtros entram na Fase 9. Este
        frontend ainda não deve ser exposto publicamente.
      </p>
      <ul className="mt-6 space-y-2">
        {routes.map((route) => (
          <li key={route.href}>
            <a className="text-sky-400 underline" href={route.href}>
              {route.label}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
