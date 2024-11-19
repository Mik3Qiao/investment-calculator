"use client"

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formatCurrency = (number) => {
  if (number >= 1000000) {
    return `$${(number / 1000000).toFixed(2)}M`;
  } else if (number >= 1000) {
    return `$${(number / 1000).toFixed(2)}K`;
  } else {
    return `$${number.toFixed(2)}`;
  }
};

// Replace the existing formatPercentage function
const formatPercentage = (number) => {
  return isFinite(number) ? `${number.toFixed(2)}%` : '0.00%';
};
  
const InvestmentCalculator = () => {
  const [formData, setFormData] = useState({
    frequency: 'monthly',
    amount: '',
    rate: '',
    inflation: '',
    years: ''
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Helper functions for calculations
  const calculateRealRate = (nominal, inflation) => {
    return (1 + nominal) / (1 + inflation) - 1;
  };

  const calculateFutureValue = (amount, rate, periods) => {
    return amount * ((1 + rate) ** periods - 1) / rate;
  };

	const calculateGrowthRate = (finalValue, initialValue, years) => {
		if (years === 0 || initialValue === 0) return 0;
		// Handle negative growth scenarios
		const growthRate = ((finalValue / initialValue) ** (1 / years) - 1) * 100;
		return isFinite(growthRate) ? growthRate : 0;
	};

  const generateTimelineData = (amount, nominalRate, realRate, periodsPerYear, years) => {
    const data = [];
    const nominalRatePerPeriod = nominalRate / periodsPerYear;
    const realRatePerPeriod = realRate / periodsPerYear;
    const initialYearlyInvestment = amount * periodsPerYear;

    for (let year = 0; year <= years; year++) {
      const periods = year * periodsPerYear;
      const nominal = periods === 0 ? 0 : calculateFutureValue(amount, nominalRatePerPeriod, periods);
      const real = periods === 0 ? 0 : calculateFutureValue(amount, realRatePerPeriod, periods);
      const totalInvested = amount * periods;
      
      // Calculate growth percentages
      const nominalGrowth = totalInvested > 0 ? ((nominal - totalInvested) / totalInvested) * 100 : 0;
			const realGrowth = totalInvested > 0 ? ((real - totalInvested) / totalInvested) * 100 : 0;
      
      data.push({
        year,
        nominal: Math.round(nominal),
        real: Math.round(real),
        totalInvested: Math.round(totalInvested),
        nominalGrowth,
        realGrowth
      });
    }
    return data;
  };

  const handleCalculate = () => {
    try {
      const amount = parseFloat(formData.amount);
      const nominalRate = parseFloat(formData.rate) / 100;
      const inflationRate = parseFloat(formData.inflation) / 100;
      const years = parseFloat(formData.years);

      if ([amount, nominalRate, inflationRate, years].some(isNaN)) {
        throw new Error('Please fill in all fields with valid numbers');
      }

			if (inflationRate >= 1) {
				throw new Error('Inflation rate must be less than 100%');
			}
			if (nominalRate <= 0) {
				throw new Error('Expected return rate must be greater than 0%');
			}

      const periodsPerYear = {
        weekly: 52,
        biweekly: 26,
        monthly: 12
      }[formData.frequency];

      const realRate = calculateRealRate(nominalRate, inflationRate);
      const totalPeriods = periodsPerYear * years;
      const nominalRatePerPeriod = nominalRate / periodsPerYear;
      const realRatePerPeriod = realRate / periodsPerYear;

      const futureValueNominal = calculateFutureValue(amount, nominalRatePerPeriod, totalPeriods);
      const futureValueReal = calculateFutureValue(amount, realRatePerPeriod, totalPeriods);
      
      const monthlyTotal = amount * (periodsPerYear / 12);
      const yearlyTotal = amount * periodsPerYear;
      const totalInvested = yearlyTotal * years;

      // Calculate total return percentages
      const nominalReturnPercentage = totalInvested > 0 ? 
				((futureValueNominal - totalInvested) / totalInvested) * 100 : 0;
			const realReturnPercentage = totalInvested > 0 ? 
				((futureValueReal - totalInvested) / totalInvested) * 100 : 0;
      
      // Calculate annualized return rates
      const annualizedNominalReturn = isFinite(calculateGrowthRate(futureValueNominal, totalInvested, years)) ? 
				calculateGrowthRate(futureValueNominal, totalInvested, years) : 0;
			const annualizedRealReturn = isFinite(calculateGrowthRate(futureValueReal, totalInvested, years)) ? 
				calculateGrowthRate(futureValueReal, totalInvested, years) : 0;

      setResults({
        monthlyTotal,
        yearlyTotal,
        totalInvested,
        futureValueNominal,
        futureValueReal,
        nominalReturnPercentage,
        realReturnPercentage,
        annualizedNominalReturn,
        annualizedRealReturn,
        timelineData: generateTimelineData(amount, nominalRate, realRate, periodsPerYear, years)
      });
      setError('');
    } catch (err) {
      setError(err.message);
      setResults(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-slate-900 text-white shadow-xl">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-2xl font-bold text-white">Investment Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-200">Investment Frequency</Label>
              <select 
                className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Amount per Period ($)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Expected Return Rate (%)</Label>
              <Input
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="Enter expected return rate"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Inflation Rate (%)</Label>
              <Input
                type="number"
                value={formData.inflation}
                onChange={(e) => setFormData(prev => ({ ...prev, inflation: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="Enter inflation rate"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Investment Years</Label>
              <Input
                type="number"
                value={formData.years}
                onChange={(e) => setFormData(prev => ({ ...prev, years: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="Enter number of years"
              />
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
          >
            Calculate
          </Button>

          {error && (
            <Alert variant="destructive" className="bg-red-900 border-red-800">
              <AlertDescription className="text-white">{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Monthly Investment</h3>
                  <p className="text-2xl text-white">{formatCurrency(results.monthlyTotal)}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Yearly Investment</h3>
                  <p className="text-2xl text-white">{formatCurrency(results.yearlyTotal)}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Total Amount Invested</h3>
                  <p className="text-2xl text-white">{formatCurrency(results.totalInvested)}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Total Growth (Nominal)</h3>
                  <p className="text-2xl text-white">{formatPercentage(results.nominalReturnPercentage)}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Total Growth (Real)</h3>
                  <p className="text-2xl text-white">{formatPercentage(results.realReturnPercentage)}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Annualized Return (Nominal)</h3>
                  <p className="text-2xl text-white">{formatPercentage(results.annualizedNominalReturn)}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-slate-200">Annualized Return (Real)</h3>
                  <p className="text-2xl text-white">{formatPercentage(results.annualizedRealReturn)}</p>
                </div>
              </div>

              <div className="w-full h-64 bg-slate-800 p-4 rounded-lg border border-slate-700">
                <LineChart data={results.timelineData} width={800} height={250} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563"/>
                  <XAxis dataKey="year" stroke="#E5E7EB"/>
                  <YAxis stroke="#E5E7EB" tickFormatter={(value) => formatCurrency(value)}/>
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'nominalGrowth' || name === 'realGrowth') {
                        return [formatPercentage(value), name];
                      }
                      return [formatCurrency(value), name];
                    }}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="nominal" stroke="#60A5FA" name="Nominal Value" />
                  <Line type="monotone" dataKey="real" stroke="#34D399" name="Real Value" />
                  <Line type="monotone" dataKey="totalInvested" stroke="#818CF8" name="Total Invested" />
                </LineChart>
              </div>

              <div className="w-full h-64 bg-slate-800 p-4 rounded-lg border border-slate-700">
                <LineChart data={results.timelineData} width={800} height={250} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563"/>
                  <XAxis dataKey="year" stroke="#E5E7EB"/>
                  <YAxis stroke="#E5E7EB" tickFormatter={(value) => `${value.toFixed(2)}%`}/>
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)}%`]}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="nominalGrowth" stroke="#60A5FA" name="Nominal Growth %" />
                  <Line type="monotone" dataKey="realGrowth" stroke="#34D399" name="Real Growth %" />
                </LineChart>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentCalculator;