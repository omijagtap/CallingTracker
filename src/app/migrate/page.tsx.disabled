"use client";

import { useState } from 'react';
import { Loader2, Database, Upload, CheckCircle, AlertCircle } from 'lucide-react';

// Inline UI Components to avoid import issues
const Button = ({ children, className = "", disabled = false, onClick, ...props }: any) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Alert = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative w-full rounded-lg border p-4 ${className}`}>
    {children}
  </div>
);

const AlertDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);

export default function MigrationPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAction = async (action: string) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        if (action === 'status') {
          setStatus(result.data);
        }
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    await handleAction('status');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Migration Tool</h1>
        <p className="text-muted-foreground">
          Migrate your JSON data to Supabase database
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Status
            </CardTitle>
            <CardDescription>
              Check current data in Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkStatus} 
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check Status
            </Button>

            {status && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span className="font-medium">{status.users}</span>
                </div>
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <span className="font-medium">{status.activities}</span>
                </div>
                <div className="flex justify-between">
                  <span>CSV Uploads:</span>
                  <span className="font-medium">{status.csvUploads}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remarks:</span>
                  <span className="font-medium">{status.remarks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Learner Details:</span>
                  <span className="font-medium">{status.learnerDetails}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Migration Actions
            </CardTitle>
            <CardDescription>
              Backup and migrate your JSON data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleAction('backup')} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              1. Backup JSON Data
            </Button>

            <Button 
              onClick={() => handleAction('migrate')} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              2. Migrate to Supabase
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Migration Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Before Migration:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ensure your Supabase database is set up with the required tables</li>
              <li>Copy <code>.env.example</code> to <code>.env.local</code> with your credentials</li>
              <li>Make sure your JSON files are in the <code>/data</code> directory</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Migration Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Backup JSON Data" to create a backup of your existing data</li>
              <li>Click "Migrate to Supabase" to transfer data to the database</li>
              <li>Use "Check Status" to verify the migration was successful</li>
            </ol>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Make sure to run the SQL schema creation commands in your Supabase dashboard before migrating data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
