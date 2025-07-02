import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, Zap, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const NewsletterManagement = () => {
  const { user } = useAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleCollectContent = async () => {
    if (!user) return;
    
    setIsCollecting(true);
    try {
      const { error } = await supabase.functions.invoke('collect-content');
      
      if (error) {
        throw error;
      }
      
      toast.success('Raccolta contenuti completata con successo!');
    } catch (error) {
      console.error('Errore nella raccolta contenuti:', error);
      toast.error('Errore durante la raccolta contenuti');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!user) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-newsletter');
      
      if (error) {
        throw error;
      }
      
      toast.success('Newsletter inviata con successo!');
    } catch (error) {
      console.error('Errore nell\'invio newsletter:', error);
      toast.error('Errore durante l\'invio della newsletter');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Effettua il login per gestire la newsletter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Newsletter Personalizzata
          </CardTitle>
          <CardDescription>
            Gestisci la raccolta di contenuti e l'invio della newsletter giornaliera personalizzata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Programma Automatico
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              La newsletter viene inviata automaticamente ogni giorno alle 8:00 (ora di Milano) 
              con contenuti personalizzati basati sui tuoi interessi.
            </p>
          </div>

          {/* Manual Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Raccolta Contenuti
                </CardTitle>
                <CardDescription className="text-sm">
                  Avvia manualmente la raccolta di nuovi contenuti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCollectContent}
                  disabled={isCollecting}
                  className="w-full"
                  variant="outline"
                >
                  {isCollecting ? 'Raccogliendo...' : 'Avvia Raccolta'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  Invio Newsletter
                </CardTitle>
                <CardDescription className="text-sm">
                  Invia immediatamente la newsletter personalizzata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleSendNewsletter}
                  disabled={isSending}
                  className="w-full"
                >
                  {isSending ? 'Inviando...' : 'Invia Newsletter'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Come Funziona
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">1</Badge>
                <h4 className="font-medium mb-1">Raccolta</h4>
                <p className="text-sm text-muted-foreground">
                  Il sistema raccoglie contenuti da fonti affidabili utilizzando Firecrawl
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">2</Badge>
                <h4 className="font-medium mb-1">Personalizzazione</h4>
                <p className="text-sm text-muted-foreground">
                  I contenuti vengono classificati e abbinati ai tuoi interessi
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">3</Badge>
                <h4 className="font-medium mb-1">Consegna</h4>
                <p className="text-sm text-muted-foreground">
                  Ricevi una newsletter personalizzata con 5 contenuti selezionati
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterManagement;