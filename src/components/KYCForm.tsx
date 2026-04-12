import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { User } from '../types';
import { ShieldCheck, Upload, Building2, MapPin, CreditCard } from 'lucide-react';

interface KYCFormProps {
  onComplete: (user: Partial<User>) => void;
}

export const KYCForm: React.FC<KYCFormProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    city: 'Baghdad',
    licenseNumber: '',
    idNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      company_name: formData.companyName,
      address: `${formData.address}, ${formData.city}`,
      kyc_status: 'Pending',
    });
  };

  return (
    <Card className="max-w-2xl mx-auto border-border shadow-2xl bg-card overflow-hidden rounded-3xl">
      <CardHeader className="bg-primary text-primary-foreground p-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-heading font-bold">Trader Verification (KYC)</CardTitle>
            <p className="text-xs text-primary-foreground/70 font-medium uppercase tracking-widest">Complete your profile to start trading</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10">
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0" />
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                step >= s ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' : 'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Business' : s === 2 ? 'Documents' : 'Review'}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Company / Shop Name</Label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="companyName" 
                    className="pl-11 h-12 bg-muted/30 border-border rounded-xl focus-visible:ring-primary" 
                    placeholder="e.g. Al-Rafidain Gold Trading" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="address" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Full Address</Label>
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="address" 
                    className="pl-11 h-12 bg-muted/30 border-border rounded-xl focus-visible:ring-primary" 
                    placeholder="Street, District" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="city" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">City / Province</Label>
                  <Input 
                    id="city" 
                    className="h-12 bg-muted/30 border-border rounded-xl focus-visible:ring-primary"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="license" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Trade License No.</Label>
                  <Input 
                    id="license" 
                    className="h-12 bg-muted/30 border-border rounded-xl focus-visible:ring-primary"
                    placeholder="Optional" 
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  />
                </div>
              </div>
              <Button type="button" className="w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" onClick={() => setStep(2)}>Next Step</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-2 border-dashed border-border rounded-3xl text-center space-y-4 bg-muted/10 hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => document.getElementById('id-upload')?.click()}>
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Upload ID or Passport</div>
                  <p className="text-xs text-muted-foreground mt-1">Drag and drop or click to browse</p>
                </div>
                <Input type="file" className="hidden" id="id-upload" />
              </div>
              <div className="p-8 border-2 border-dashed border-border rounded-3xl text-center space-y-4 bg-muted/10 hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => document.getElementById('license-upload')?.click()}>
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Upload Business License</div>
                  <p className="text-xs text-muted-foreground mt-1">Official government document</p>
                </div>
                <Input type="file" className="hidden" id="license-upload" />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-12 border-border font-bold uppercase tracking-widest" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" className="flex-1 h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest shadow-xl shadow-primary/20" onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-muted/30 p-6 rounded-3xl space-y-4 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Company</span>
                  <span className="font-bold text-foreground">{formData.companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Location</span>
                  <span className="font-bold text-foreground">{formData.address}, {formData.city}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Documents</span>
                  <span className="text-emerald-500 font-bold text-xs">2 FILES READY</span>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[10px] text-primary/70 italic font-medium leading-relaxed text-center">
                  By submitting, you agree that your information will be reviewed by our administrators. 
                  Trading will be enabled once your account is verified.
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-12 border-border font-bold uppercase tracking-widest" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" className="flex-1 h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all">Submit Verification</Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
