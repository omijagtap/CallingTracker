'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context-supabase';
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function SimpleEmailWidget() {
  const { user } = useAuth();
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setSending(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/send-email');
      const data = await response.json();
      
      if (data.success) {
        setResult({ success: true, message: "SMTP connection working!" });
        toast({
          title: "Connection Test Successful",
          description: "Email system is ready to send emails",
        });
      } else {
        setResult({ success: false, message: data.error });
        toast({
          title: "Connection Test Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Network error occurred';
      setResult({ success: false, message: errorMessage });
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const sendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          userId: user?.id || 'admin'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult({ success: true, message: "Email sent successfully!" });
        toast({
          title: "Email Sent",
          description: `Email sent to ${emailData.to}`,
        });
        // Clear form
        setEmailData({ to: '', subject: '', message: '' });
      } else {
        setResult({ success: false, message: data.error });
        toast({
          title: "Email Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Network error occurred';
      setResult({ success: false, message: errorMessage });
      toast({
        title: "Send Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-500" />
          Simple Email Sender
        </CardTitle>
        <CardDescription>
          Send emails with working SMTP configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to">To Email Address</Label>
          <Input
            id="to"
            type="email"
            placeholder="recipient@example.com"
            value={emailData.to}
            onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Your email message here..."
            rows={4}
            value={emailData.message}
            onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
          />
          <p className="text-xs text-gray-500">
            URLs will automatically become clickable links
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={sending}
            variant="outline"
            className="flex-1"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>

          <Button 
            onClick={sendEmail} 
            disabled={sending}
            className="flex-1"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className={`p-3 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded">
          <p><strong>Email Configuration:</strong></p>
          <p>• Host: smtp.office365.com:587</p>
          <p>• From: intlesgcidba@upgrad.com</p>
          <p>• Activity tracking: Enabled (Supabase)</p>
          <p>• Status: Working credentials from Python script</p>
        </div>
      </CardContent>
    </Card>
  );
}
