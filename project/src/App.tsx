import React, { useState, useEffect } from 'react';
import { Bitcoin, Users, LineChart, PieChart, Upload, Globe2, Lightbulb, ArrowRight, Loader2, FileDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { NostrLogin } from './components/NostrLogin';
import { CSVUploader } from './components/CSVUploader';
import { NostrService } from './lib/nostr';
import { mockSurveys } from './lib/mockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function App() {
  const [user, setUser] = useState<any>(null);
  const [nostr] = useState(() => new NostrService());
  const [isLoading, setIsLoading] = useState(true);
  const [surveyData, setSurveyData] = useState<any[]>([]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await nostr.init();
        // Load mock surveys directly
        setSurveyData([mockSurveys.fabricioSurvey, mockSurveys.emiliaSurvey]);
      } catch (error) {
        console.warn('Initialization warning:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    initializeApp();
  }, [nostr]);

  const renderDistributionChart = (key: string, distribution: any) => {
    if (distribution.type === 'numeric') {
      const labels = Array.from({ length: distribution.histogram.bins.length }, (_, i) => {
        const start = distribution.histogram.min + (i * distribution.histogram.binSize);
        const end = start + distribution.histogram.binSize;
        return `${start.toFixed(1)}-${end.toFixed(1)}`;
      });

      const data = {
        labels,
        datasets: [{
          label: 'Frequency',
          data: distribution.histogram.bins,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }],
      };

      return (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">{key} Distribution</h3>
          <div className="chart-container">
            <Bar
              data={data}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Average</p>
              <p className="font-semibold">{distribution.average.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Median</p>
              <p className="font-semibold">{distribution.median.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Range</p>
              <p className="font-semibold">{distribution.min.toFixed(1)} - {distribution.max.toFixed(1)}</p>
            </div>
          </div>
        </div>
      );
    } else if (distribution.type === 'categorical' || distribution.type === 'boolean') {
      const data = {
        labels: Object.keys(distribution.frequency),
        datasets: [{
          data: Object.values(distribution.frequency),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        }],
      };

      return (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">{key} Distribution</h3>
          <div className="chart-container">
            <Pie data={data} options={{ maintainAspectRatio: false }} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Total Responses</p>
            <p className="font-semibold">{distribution.total}</p>
          </div>
        </div>
      );
    }
  };

  const handleLogin = (nostrUser: any) => {
    setUser(nostrUser);
  };

  const handleDataUpdate = async (newData: any) => {
    setSurveyData(prevData => [newData, ...prevData]);
  };

  const generateCSV = (survey: any) => {
    const distributions = survey.data.distributions;
    const headers = Object.keys(distributions);
    const rows: string[][] = [headers];

    // Find the maximum number of responses
    const maxResponses = Math.max(...Object.values(distributions).map((dist: any) => {
      if (dist.type === 'numeric') {
        return dist.histogram.bins.reduce((a: number, b: number) => a + b, 0);
      }
      return Object.values(dist.frequency).reduce((a: number, b: number) => a + b, 0);
    }));

    // Generate rows for each response
    for (let i = 0; i < maxResponses; i++) {
      const row = headers.map(header => {
        const dist = distributions[header];
        if (dist.type === 'numeric') {
          // For numeric distributions, reconstruct individual responses from histogram
          const value = dist.min + (dist.histogram.binSize * Math.floor(i / (maxResponses / dist.histogram.bins.length)));
          return value.toFixed(1);
        } else {
          // For categorical distributions, distribute frequencies
          const categories = Object.keys(dist.frequency);
          let count = 0;
          for (const category of categories) {
            count += dist.frequency[category];
            if (i < count) return category;
          }
          return '';
        }
      });
      rows.push(row);
    }

    return rows.map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (survey: any) => {
    const csv = generateCSV(survey);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', survey.filename || 'survey_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-yellow-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <header className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-full p-6">
                <Bitcoin className="w-20 h-20 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Bitcoin Street Survey Repository
            </h1>
            <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
              Collect, analyze, and share Bitcoin adoption insights from your community surveys
            </p>
            
            {!user ? (
              <NostrLogin onLogin={handleLogin} />
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
                <p className="text-white">
                  Connected as: {user.npub?.slice(0, 8)}...{user.npub?.slice(-8)}
                </p>
              </div>
            )}
          </header>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Globe2 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold">Global Insights</h3>
            </div>
            <p className="text-gray-600">
              Contribute to a worldwide database of Bitcoin adoption metrics and community feedback
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <LineChart className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold">Data Analysis</h3>
            </div>
            <p className="text-gray-600">
              Visualize survey results with interactive charts and comprehensive analytics
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Lightbulb className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold">Community Insights</h3>
            </div>
            <p className="text-gray-600">
              Understand Bitcoin awareness and adoption trends in your local community
            </p>
          </div>
        </div>

        {user && (
          <div className="mb-16">
            <CSVUploader 
              nostrService={nostr} 
              onDataUpdate={handleDataUpdate}
            />
          </div>
        )}

        {!user && (
          <div className="text-center mb-16">
            <button 
              onClick={() => document.querySelector('button')?.click()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-500 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              Connect to Start <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Mock Surveys Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Recent Surveys</h2>
          {surveyData.map((survey, index) => (
            <div key={survey.id} className="mb-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Survey from {survey.data.metadata?.location}
                    </h3>
                    <p className="text-white/90">
                      Conducted by: {survey.data.metadata?.interviewer} on {new Date(survey.data.metadata?.date).toLocaleDateString()}
                    </p>
                    <p className="text-white/80 text-sm mt-2">
                      Total Respondents: {survey.data.totalRespondents}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadCSV(survey)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <FileDown className="w-5 h-5" />
                    Download CSV
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {Object.entries(survey.data.distributions).map(([key, distribution]: [string, any]) => (
                  <div key={key} className="col-span-1">
                    {renderDistributionChart(key, distribution)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8">
        <div className="text-center text-white/80">
          <p>© 2025 Bitcoin Street Survey Repository. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;