
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LearnerData } from "@/lib/types";

interface EditRemarkDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  learner: LearnerData;
  initialRemark: string;
  onSave: (learner: LearnerData, remark: string) => void;
}

export function EditRemarkDialog({
  isOpen,
  setIsOpen,
  learner,
  initialRemark,
  onSave,
}: EditRemarkDialogProps) {
  const [remark, setRemark] = useState(initialRemark);

  useEffect(() => {
    if (isOpen) {
      setRemark(initialRemark);
    }
  }, [isOpen, initialRemark]);

  const handleSave = () => {
    onSave(learner, remark);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Remark for {learner.Email}</DialogTitle>
          <DialogDescription>
            Add or update the remark for this learner. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Cohort</Label>
            <span className="col-span-3 text-sm">{learner.Cohort}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Submission</Label>
            <span className="col-span-3 text-sm">{learner["Submission Name"]}</span>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="remark" className="text-right pt-2">
              Remark
            </Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
