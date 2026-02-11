'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters zijn'),
  email: z.string().email('Ongeldig e-mailadres'),
  company: z.string().min(2, 'Bedrijfsnaam moet minimaal 2 karakters zijn'),
  questionType: z.string().min(1, 'Selecteer een vraag type'),
  description: z
    .string()
    .min(10, 'Omschrijving moet minimaal 10 karakters zijn'),
});

type FormData = z.infer<typeof formSchema>;

export function IntakeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitErrorMessage('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          typeof json?.error === 'string' ? json.error : 'Submission failed';
        setSubmitErrorMessage(msg);
        setSubmitStatus('error');
        return;
      }

      setSubmitStatus('success');
      reset();
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitErrorMessage(
        error instanceof Error ? error.message : 'Er ging iets mis.'
      );
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Naam *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Uw volledige naam"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="naam@bedrijf.nl"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="company">Bedrijfsnaam *</Label>
        <Input
          id="company"
          {...register('company')}
          placeholder="Uw bedrijf"
          disabled={isSubmitting}
        />
        {errors.company && (
          <p className="text-sm text-destructive">{errors.company.message}</p>
        )}
      </div>

      {/* Question Type */}
      <div className="space-y-2">
        <Label htmlFor="questionType">Type vraag *</Label>
        <select
          id="questionType"
          {...register('questionType')}
          disabled={isSubmitting}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Selecteer een optie</option>
          <option value="automation">Automatisering</option>
          <option value="ai-integration">AI Integratie</option>
          <option value="consulting">Advies</option>
          <option value="other">Anders</option>
        </select>
        {errors.questionType && (
          <p className="text-sm text-destructive">
            {errors.questionType.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Omschrijving *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Beschrijf uw vraag of project..."
          rows={5}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Versturen...
          </>
        ) : (
          'Verstuur aanvraag'
        )}
      </Button>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
          ✅ Bedankt! We hebben uw aanvraag ontvangen en nemen binnen 24 uur
          contact op.
        </div>
      )}
      {submitStatus === 'error' && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
          ❌ {submitErrorMessage || 'Er ging iets mis.'} Probeer het opnieuw of
          mail naar info@matmat.me
        </div>
      )}
    </form>
  );
}
