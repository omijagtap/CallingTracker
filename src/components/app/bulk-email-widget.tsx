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
import { Mail, Send, Users, FileText, Loader2 } from 'lucide-react';

export function BulkEmailWidget() {
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const sendBulkEmail = async () => {
    if (!emails.trim() || !subject.trim() || !message.trim()) {
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
      // Parse emails (comma or newline separated)
      const emailList = emails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      if (emailList.length === 0) {
        throw new Error('No valid email addresses found');
      }

      console.log(`Sending bulk email to ${emailList.length} recipients...`);

      const response = await fetch('/api/send-bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailList,
          subject: subject,
          message: message,
          mode: 'bulk-bcc' // Use bulk BCC mode like Python script
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        toast({
          title: "Bulk Email Sent Successfully!",
          description: `Sent to ${data.summary.sent} out of ${data.summary.total} recipients`,
        });
      } else {
        throw new Error(data.error || 'Failed to send bulk email');
      }
    } catch (error: any) {
      console.error('Bulk email error:', error);
      toast({
        title: "Bulk Email Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const testSingleEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in subject and message",
        variant: "destructive",
      });
      return;
    }

    const testEmail = prompt("Enter test email address:");
    if (!testEmail || !testEmail.includes('@')) {
      return;
    }

    setSending(true);
    
    try {
      const response = await fetch('/api/send-bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: [testEmail],
          subject: `[TEST] ${subject}`,
          message: `[THIS IS A TEST EMAIL]\n\n${message}`,
          mode: 'bulk-bcc'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Test Email Sent!",
          description: `Test email sent to ${testEmail}`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test email');
      }
    } catch (error: any) {
      toast({
        title: "Test Email Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-500" />
          Bulk Email Sender
        </CardTitle>
        <CardDescription>
          Send emails to multiple recipients using the same logic as your Python script
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Email Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your email message here..."
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            URLs will automatically become clickable links
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emails">Email Addresses</Label>
          <Textarea
            id="emails"
            placeholder="Enter email addresses (comma or newline separated)&#10;example1@email.com&#10;example2@email.com"
            rows={4}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Separate multiple emails with commas or new lines
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testSingleEmail} 
            disabled={sending}
            variant="outline"
            className="flex-1"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Send Test Email
          </Button>

          <Button 
            onClick={sendBulkEmail} 
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
                <Users className="w-4 h-4 mr-2" />
                Send Bulk Email
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Email Summary</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Total Recipients: {result.summary.total}</p>
              <p>• Successfully Sent: {result.summary.sent}</p>
              <p>• Failed: {result.summary.failed}</p>
              <p>• Mode: {result.summary.mode}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded">
          <p><strong>Email Configuration:</strong></p>
          <p>• Using working Python script credentials</p>
          <p>• Host: smtp.office365.com:587</p>
          <p>• From: intlesgcidba@upgrad.com</p>
          <p>• Mode: Bulk BCC (same email to all recipients)</p>
        </div>
      </CardContent>
    </Card>
  );
}
