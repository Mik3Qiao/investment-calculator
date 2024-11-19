import InvestmentCalculator from '../components/InvestmentCalculator';

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Investment Calculator</h1>
        <InvestmentCalculator />
      </div>
    </main>
  );
}