interface DataRowProps {
  category: string;
  sales: number;
  products: number;
  total: number;
  cost: number;
}

const DataRow = ({ category, sales, products, total, cost }: DataRowProps) => {
  return (
    <div className="bg-dataSection text-dataSection-foreground px-6 py-4 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="uppercase font-bold">{category}</span>
        <span className="opacity-80">- VENDAS:</span>
        <span className="font-bold">{sales}</span>
        <span className="opacity-80">({products} PRODUTOS)</span>
        <span className="opacity-80">| TOTAL:</span>
        <span className="font-bold">R$ {total.toFixed(2)}</span>
        <span className="opacity-80">| CUSTO:</span>
        <span className="font-bold">R$ {cost.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const DataSection = () => {
  const categories = [
    { category: "MATRIZ", sales: 0, products: 0, total: 0, cost: 0 },
    { category: "JARDINS", sales: 0, products: 0, total: 0, cost: 0 },
    { category: "TIRO", sales: 0, products: 0, total: 0, cost: 0 },
    { category: "MULTI", sales: 0, products: 0, total: 0, cost: 0 },
  ];

  return (
    <div className="space-y-3">
      {categories.map((data) => (
        <DataRow key={data.category} {...data} />
      ))}
    </div>
  );
};
