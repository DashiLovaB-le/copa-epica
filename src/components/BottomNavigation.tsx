import { Link } from "@tanstack/react-router";
import palpitesIcon from "@/assets/palpites.png";
import rankingIcon from "@/assets/ranking.png";
import rodadasIcon from "@/assets/rodadas.png";
import perfilIcon from "@/assets/perfil.png";

const items = [
  { to: "/palpites", label: "Palpites", icon: palpitesIcon },
  { to: "/ranking", label: "Ranking", icon: rankingIcon },
  { to: "/rodadas", label: "Rodadas", icon: rodadasIcon },
  { to: "/perfil", label: "Perfil", icon: perfilIcon },
] as const;

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white brutal-border border-x-0 border-b-0">
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className="flex flex-col items-center justify-center gap-1 py-3 font-bold uppercase text-[10px] tracking-widest text-black data-[status=active]:bg-brand-blue-gradient data-[status=active]:text-white border-r-[3px] last:border-r-0 border-black"
              activeOptions={{ exact: false }}
            >
              <img src={it.icon} alt="" className="w-6 h-6 object-contain" />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
