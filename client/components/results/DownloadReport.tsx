import { Download, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DownloadReportProps {
  className?: string;
}

export default function DownloadReport({ className = '' }: DownloadReportProps) {
  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation and download
    console.log('Downloading PDF report...');
    // This would typically trigger a server endpoint to generate a PDF
    // For now, we'll just show an alert
    alert('PDF download functionality would be implemented here');
  };

  const handleDownloadExcel = () => {
    // TODO: Implement Excel export
    console.log('Downloading Excel report...');
    alert('Excel export functionality would be implemented here');
  };

  const handleShareReport = () => {
    // TODO: Implement share functionality
    console.log('Sharing report...');
    if (navigator.share) {
      navigator.share({
        title: 'GeoSight Analysis Report',
        text: 'Check out my GeoSight analysis report',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-geo-blue-500" />
          Download & Export Report
        </CardTitle>
        <CardDescription>
          Export your analysis results in various formats or share your findings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PDF Download */}
          <Button 
            onClick={handleDownloadPDF}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200"
          >
            <Download className="w-6 h-6 text-red-600" />
            <div className="text-center">
              <div className="font-medium text-gray-900">PDF Report</div>
              <div className="text-sm text-gray-500">Complete analysis</div>
            </div>
          </Button>

          {/* Excel Export */}
          <Button 
            onClick={handleDownloadExcel}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200"
          >
            <Download className="w-6 h-6 text-green-600" />
            <div className="text-center">
              <div className="font-medium text-gray-900">Excel Export</div>
              <div className="text-sm text-gray-500">Raw data & charts</div>
            </div>
          </Button>

          {/* Share Report */}
          <Button 
            onClick={handleShareReport}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
          >
            <Share2 className="w-6 h-6 text-blue-600" />
            <div className="text-center">
              <div className="font-medium text-gray-900">Share Report</div>
              <div className="text-sm text-gray-500">Link or social media</div>
            </div>
          </Button>
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-600">
              <strong>PDF Report</strong> includes all charts, analysis summary, and recommendations in a professional format.
            </div>
          </div>
          <div className="flex items-start gap-3 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-600">
              <strong>Excel Export</strong> contains raw data, rankings, and chart data for further analysis.
            </div>
          </div>
          <div className="flex items-start gap-3 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-gray-600">
              <strong>Share Report</strong> allows you to share your findings with team members or stakeholders.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
