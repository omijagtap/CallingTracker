'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function EmailSetupWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const setupEmailTable = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔧 Setting up email activities table...');
      
      const response = await fetch('/api/setup-email-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Email activities table created successfully! Email tracking is now active.');
        console.log('✅ Email table setup completed');
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to setup email table');
        console.error('❌ Email table setup failed:', result.error);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error occurred');
      console.error('❌ Email table setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTableStatus = async () => {
    try {
      const response = await fetch('/api/setup-email-table');
      const result = await response.json();
      
      if (result.exists) {
        setStatus('success');
        setMessage(`Email table exists with ${result.recordCount} records`);
      } else {
        setStatus('error');
        setMessage('Email table does not exist');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to check table status');
    }
  };

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          📧 Email Tracking Setup
        </CardTitle>
        <CardDescription>
          Setup email activities table for proper email counting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={setupEmailTable}
            disabled={isLoading}
            className="flex-1"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Setup Email Table
              </>
            )}
          </Button>
          
          <Button 
            onClick={checkTableStatus}
            variant="outline"
            size="sm"
          >
            Check Status
          </Button>
        </div>

        {status !== 'idle' && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            status === 'success' 
              ? 'bg-green-500/20 border border-green-500/30' 
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            {status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-sm">
              <div className={`font-medium ${
                status === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {status === 'success' ? 'Success!' : 'Error'}
              </div>
              <div className={status === 'success' ? 'text-green-200' : 'text-red-200'}>
                {message}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          <p><strong>Note:</strong> This creates the email_activities table in Supabase to track all sent emails properly.</p>
        </div>
      </CardContent>
    </Card>
  );
}
