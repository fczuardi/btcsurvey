import React, { useState } from 'react';
import { Upload, Loader2, FileDown } from 'lucide-react';
import { NostrService } from '../lib/nostr';

interface CSVUploaderProps {
  nostrService: NostrService;
  onDataUpdate: (data: any) => void;
}

interface Column {
  name: string;
  type: 'numeric' | 'boolean' | 'categorical';
  uniqueValues?: Set<string>;
}

const SAMPLE_CSV = `bitcoin_knowledge,payment_method,age_group,location_type
8,bitcoin,25-34,urban
3,cash,35-44,rural
5,card,18-24,suburban`;

export function CSVUploader({ nostrService, onDataUpdate }: CSVUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectColumnType = (values: string[]): 'numeric' | 'boolean' | 'categorical' => {
    // Check if all values are numbers
    if (values.every(v => !isNaN(Number(v)))) {
      return 'numeric';
    }
    // Check if all values are boolean-like
    if (values.every(v => ['true', 'false', 'yes', 'no', '0', '1'].includes(v.toLowerCase()))) {
      return 'boolean';
    }
    // Otherwise, treat as categorical
    return 'categorical';
  };

  const analyzeColumns = (headers: string[], data: string[][]): Record<string, Column> => {
    const columns: Record<string, Column> = {};

    headers.forEach((header, index) => {
      const values = data.map(row => row[index]);
      const type = detectColumnType(values);
      
      columns[header] = {
        name: header,
        type,
        uniqueValues: type === 'categorical' ? new Set(values) : undefined
      };
    });

    return columns;
  };

  const processCSVData = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

    // Analyze column types and structure
    const columns = analyzeColumns(headers, data);

    // Initialize result object
    const result: any = {
      totalRespondents: data.length,
      columns: {},
      distributions: {},
      correlations: []
    };

    // Process each column
    headers.forEach(header => {
      const column = columns[header];
      const values = data.map(row => row[headers.indexOf(header)]);

      if (column.type === 'numeric') {
        // For numeric columns, calculate distribution and statistics
        const numbers = values.map(v => Number(v));
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = sum / numbers.length;
        const sorted = [...numbers].sort((a, b) => a - b);
        
        result.distributions[header] = {
          type: 'numeric',
          average: avg,
          median: sorted[Math.floor(sorted.length / 2)],
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          histogram: calculateHistogram(numbers)
        };
      } else if (column.type === 'categorical' || column.type === 'boolean') {
        // For categorical/boolean columns, calculate frequency distribution
        const frequency: Record<string, number> = {};
        values.forEach(value => {
          frequency[value] = (frequency[value] || 0) + 1;
        });

        result.distributions[header] = {
          type: column.type,
          frequency,
          total: values.length
        };
      }
    });

    // Look for correlations between numeric columns
    const numericColumns = headers.filter(h => columns[h].type === 'numeric');
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        const correlation = calculateCorrelation(
          data.map(row => Number(row[headers.indexOf(col1)])),
          data.map(row => Number(row[headers.indexOf(col2)]))
        );
        if (!isNaN(correlation)) {
          result.correlations.push({
            columns: [col1, col2],
            value: correlation
          });
        }
      }
    }

    return result;
  };

  const calculateHistogram = (numbers: number[], bins = 10) => {
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min;
    const binSize = range / bins;
    
    const histogram = Array(bins).fill(0);
    numbers.forEach(num => {
      const binIndex = Math.min(Math.floor((num - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });

    return {
      bins: histogram,
      binSize,
      min,
      max
    };
  };

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const processedData = processCSVData(text);
        
        // Publish to Nostr
        const nostrEvent = await nostrService.publishSurveyData({
          type: 'csv_upload',
          filename: file.name,
          data: processedData,
        });

        if (!nostrEvent) {
          throw new Error('Failed to publish to Nostr');
        }

        onDataUpdate(processedData);
        setLoading(false);
        event.target.value = '';
      };

      reader.readAsText(file);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_survey.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-semibold">Upload Survey Results</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-orange-300 border-dashed rounded-lg cursor-pointer bg-orange-50 hover:bg-orange-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-3 text-orange-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">CSV files only</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>

        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:text-orange-700 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Download Sample CSV
        </button>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">CSV Format Guidelines:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>First row must contain column headers</li>
            <li>Supported data types are automatically detected:</li>
            <ul className="list-none pl-6 space-y-1">
              <li>• Numbers (e.g., ratings, ages)</li>
              <li>• Categories (e.g., locations, preferences)</li>
              <li>• Yes/No responses</li>
            </ul>
          </ul>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing file...</span>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}