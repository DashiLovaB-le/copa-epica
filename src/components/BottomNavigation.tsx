import { Link } from "@tanstack/react-router";
import { Trophy, Calendar, User, Goal } from "lucide-react";

const items = [
  { to: "/palpites", label: "Palpites", icon: Goal },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/rodadas", label: "Rodadas", icon: Calendar },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white brutal-border border-x-0 border-b-0">
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className="flex flex-col items-center justify-center gap-1 py-3 font-bold uppercase text-[10px] tracking-widest text-black data-[status=active]:bg-[color:var(--brand-blue)] data-[status=active]:text-white border-r-[3px] last:border-r-0 border-black"
                activeOptions={{ exact: false }}
              >
                <Icon className="w-6 h-6" strokeWidth={3} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
