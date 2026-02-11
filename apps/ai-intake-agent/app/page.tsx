import { IntakeForm } from '@/components/intake-form';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12 text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            🤖 AI helpt uw bedrijf groeien
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            Automatiseer taken, integreer AI, bespaar tijd en geld
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              ✅ Gratis adviesgesprek
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              ✅ 2 weken delivery
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              ✅ Vanaf €300
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Vraag een gratis adviesgesprek aan
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Vul het formulier in en we nemen binnen 24 uur contact op
          </p>
          <IntakeForm />
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center text-white">
          <p className="text-sm opacity-75 mb-4">Vertrouwd door</p>
          <div className="flex flex-wrap justify-center gap-8 text-lg font-semibold">
            <span>HBO-ICT Vereniging</span>
            <span>AI Community</span>
            <span>Student Startups</span>
          </div>
        </div>
      </div>
    </main>
  );
}
