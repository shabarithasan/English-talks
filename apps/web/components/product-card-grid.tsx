import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { productCards } from "@english-talks/shared";

export function ProductCardGrid() {
  return (
    <div className="card-grid">
      {productCards.map((product) => (
        <Link key={product.slug} href={`/${product.slug}`} className="panel route-card stack-sm">
          <span className="pill">{product.category}</span>
          <h3 style={{ fontSize: "1.2rem" }}>{product.title}</h3>
          <p className="muted">{product.description}</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--teal-dark)" }}>
            Explore <ArrowUpRight size={16} />
          </span>
        </Link>
      ))}
    </div>
  );
}
