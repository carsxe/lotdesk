import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/money";

export function SpecSheet(props: {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  vin: string;
  color?: string | null;
  bodyStyle?: string | null;
  mileage: number;
  listPriceCents: number;
  stockNumber: string;
  rooftop: string;
  equipment?: Record<string, string>;
  warranties?: { type?: string; miles?: string; months?: string }[];
  attributes?: Record<string, string | undefined>;
}) {
  const equipment = Object.entries(props.equipment ?? {}).slice(0, 10);
  return (
    <Card className="print:border-black">
      <CardHeader>
        <CardTitle>Merchandising spec sheet</CardTitle>
        <p className="text-xs text-muted-foreground">
          Built from CarsXE specifications. Print this for the windshield or VDP packet.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-lg bg-[oklch(0.22_0.035_250)] p-4 text-[oklch(0.97_0.01_85)]">
          <p className="text-xs uppercase tracking-wider opacity-70">{props.rooftop}</p>
          <p className="text-xl font-semibold">
            {props.year} {props.make} {props.model} {props.trim}
          </p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(props.listPriceCents)}</p>
          <p className="font-mono text-xs opacity-70">{props.vin}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <Item label="Stock" value={props.stockNumber} />
          <Item label="Mileage" value={formatNumber(props.mileage)} />
          <Item label="Color" value={props.color ?? "—"} />
          <Item label="Body" value={props.bodyStyle ?? "—"} />
          <Item label="Engine" value={props.attributes?.engine ?? "—"} />
          <Item label="Drivetrain" value={props.attributes?.drivetrain ?? "—"} />
          <Item label="Trans" value={props.attributes?.transmission ?? "—"} />
          <Item
            label="Fuel"
            value={
              props.attributes?.city_mileage
                ? `${props.attributes.city_mileage}/${props.attributes.highway_mileage} mpg`
                : (props.attributes?.fuel_type ?? "—")
            }
          />
        </dl>
        {equipment.length ? (
          <div>
            <p className="mb-1 font-medium">Equipment (CarsXE)</p>
            <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
              {equipment.map(([key, value]) => (
                <li key={key}>
                  {key.replace(/_/g, " ")}: {value}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {props.warranties?.length ? (
          <div>
            <p className="mb-1 font-medium">Warranties</p>
            <ul className="text-muted-foreground">
              {props.warranties.map((item) => (
                <li key={item.type}>
                  {item.type}: {item.months} / {item.miles}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
