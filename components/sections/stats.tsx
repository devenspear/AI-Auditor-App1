"use client";

import { designSystem } from "@/lib/design-system";
import { StatCard } from "@/components/blocks/stat-card";

export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  colorClass?: string;
}

interface StatsProps {
  title?: string;
  description?: string;
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

export function Stats({
  title,
  description,
  stats,
  columns = 4,
}: StatsProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className={designSystem.spacing.section}>
      <div className={designSystem.spacing.container}>
        {(title || description) && (
          <div className="text-center mb-16">
            {title && (
              <h2 className={`${designSystem.typography.h2} mb-4`}>{title}</h2>
            )}
            {description && (
              <p
                className={`${designSystem.typography.bodyLarge} text-muted-foreground max-w-2xl mx-auto`}
              >
                {description}
              </p>
            )}
          </div>
        )}

        <div className={`grid ${gridCols[columns]} gap-12`}>
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              value={stat.value}
              label={stat.label}
              prefix={stat.prefix}
              suffix={stat.suffix}
              description={stat.description}
              colorClass={stat.colorClass}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}