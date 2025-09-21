
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EmailReportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSend: (email: string) => Promise<void>;
  isSending: boolean;
}

export function EmailReportDialog({
  isOpen,
  setIsOpen,
  onSend,
  isSending,
}: EmailReportDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onSend(email);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setEmail("");
        setError("");
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
          <DialogDescription>
            Enter the recipient's email address to send the report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Recipient
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="manager@example.com"
            />
          </div>
          {error && <p className="col-span-4 text-sm text-red-500 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    