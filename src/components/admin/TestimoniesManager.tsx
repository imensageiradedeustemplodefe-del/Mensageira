"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, MessageCircle } from 'lucide-react';
import { useTestimonies } from '@/hooks/useTestimonies';

export function TestimoniesManager() {
  const { testimonies, loading, approveTestimony, deleteTestimony } = useTestimonies();
  const [expandedTestimony, setExpandedTestimony] = useState<string | null>(null);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const pendingTestimonies = testimonies.filter(t => !t.is_approved);
  const approvedTestimonies = testimonies.filter(t => t.is_approved);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Gerenciar Testemunhos</h2>
        <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span>Pendentes: {pendingTestimonies.length}</span>
          <span>Aprovados: {approvedTestimonies.length}</span>
        </div>
      </div>

      {/* Testemunhos Pendentes */}
      {pendingTestimonies.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
            <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
            Testemunhos Pendentes ({pendingTestimonies.length})
          </h3>
          <div className="grid gap-3 sm:gap-4">
            {pendingTestimonies.map((testimony) => (
              <Card key={testimony.id} className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{testimony.name}</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(testimony.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs w-fit">Pendente</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p 
                      className={`${
                        (expandedTestimony === testimony.id || testimony.content.length <= 200) 
                          ? '' 
                          : 'line-clamp-3'
                      } text-sm text-muted-foreground cursor-pointer`}
                      onClick={() => {
                        if (testimony.content.length > 200) {
                          setExpandedTestimony(
                            expandedTestimony === testimony.id ? null : testimony.id
                          );
                        }
                      }}
                    >
                      {testimony.content}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                    <Button 
                      onClick={() => approveTestimony(testimony.id)} 
                      size="sm" 
                      className="w-full sm:w-auto"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      <span className="text-xs sm:text-sm">Aprovar</span>
                    </Button>
                    <Button 
                      onClick={() => deleteTestimony(testimony.id)} 
                      variant="destructive" 
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span className="text-xs sm:text-sm">Excluir</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Testemunhos Aprovados */}
      {approvedTestimonies.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
            <Check className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-green-600" />
            Testemunhos Aprovados ({approvedTestimonies.length})
          </h3>
          <div className="grid gap-3 sm:gap-4">
            {approvedTestimonies.map((testimony) => (
              <Card key={testimony.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{testimony.name}</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(testimony.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600 text-xs w-fit">Aprovado</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p 
                      className={`${
                        (expandedTestimony === testimony.id || testimony.content.length <= 200) 
                          ? '' 
                          : 'line-clamp-3'
                      } text-sm text-muted-foreground cursor-pointer`}
                      onClick={() => {
                        if (testimony.content.length > 200) {
                          setExpandedTestimony(
                            expandedTestimony === testimony.id ? null : testimony.id
                          );
                        }
                      }}
                    >
                      {testimony.content}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <Button 
                      onClick={() => deleteTestimony(testimony.id)} 
                      variant="destructive" 
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span className="text-xs sm:text-sm">Excluir</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {testimonies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum testemunho encontrado. Os testemunhos enviados aparecerão aqui para aprovação.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}