import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PeriodNav({
  basePath,
  period,
  prevHref,
  nextHref,
}: {
  basePath: string;
  period: string;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-1">
        <Button variant="ghost" size="sm" render={<Link href={`${basePath}?period=${prevHref}`} />}>
          <ChevronLeft />
          Mes anterior
        </Button>
        <p className="text-sm font-semibold">{period}</p>
        <Button variant="ghost" size="sm" render={<Link href={`${basePath}?period=${nextHref}`} />}>
          Mes siguiente
          <ChevronRight />
        </Button>
      </CardContent>
    </Card>
  );
}
