"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, CheckCircle, ChevronDown, ChevronUp, Shield, Heart, Clock, Eye, Trash2 } from 'lucide-react';
import { api } from '@/lib/fetcher';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Updated PrayerRequest type without sensitive fields (they're now encrypted separately)
interface SecurePrayerRequest {
  id: string;
  is_approved: boolean | null;
  is_urgent: boolean | null;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  is_completed: boolean | null;
  completed_at: string | null;
  allow_public_share: boolean | null;
  name: string;
  request_text: string;
  category: string | null;
  has_contact_info?: boolean | null;
}

export default function PrayerRequestsManager() {
  const [requests, setRequests] = useState<SecurePrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<Record<string, { email: string | null, phone: string | null }>>({});
  const { toast } = useToast();

  // Function to load contact info for a specific request
  const loadContactInfo = async (prayerRequestId: string) => {
    if (contactInfo[prayerRequestId]) return; // Already loaded
    
    try {
      const data = await api<{ email: string | null; phone: string | null }>(`/api/admin/prayers/${prayerRequestId}/contact`);
      setContactInfo(prev => ({
        ...prev,
        [prayerRequestId]: { email: data.email, phone: data.phone }
      }));
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const fetchPrayerRequests = async () => {
    try {
      setRequests(await api<SecurePrayerRequest[]>('/api/admin/prayers'));
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de oração.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayerRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api(`/api/admin/prayers/${id}`, { method: 'PATCH', json: { is_approved: true, approved_at: new Date().toISOString() } });

      setRequests(prev => prev.map(request => 
        request.id === id 
          ? { ...request, is_approved: true, approved_at: new Date().toISOString() }
          : request
      ));

      toast({
        title: "Sucesso",
        description: "Pedido de oração aprovado!",
      });
    } catch (error) {
      console.error('Error approving prayer request:', error);
      toast({
        title: "Erro", 
        description: "Erro ao aprovar pedido de oração",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api(`/api/admin/prayers/${id}`, { method: 'DELETE' });

      setRequests(prev => prev.filter(request => request.id !== id));

      toast({
        title: "Sucesso",
        description: "Pedido de oração removido.",
      });
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover pedido de oração",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api(`/api/admin/prayers/${id}`, { method: 'PATCH', json: { is_completed: true, completed_at: new Date().toISOString() } });

      setRequests(prev => prev.map(request => 
        request.id === id 
          ? { ...request, is_completed: true, completed_at: new Date().toISOString() }
          : request
      ));

      toast({
        title: "Sucesso",
        description: "Pedido de oração marcado como concluído!",
      });
    } catch (error) {
      console.error('Error completing prayer request:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar pedido como concluído",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'saude': return 'destructive';
      case 'familia': return 'secondary';
      case 'trabalho': return 'outline';
      case 'espiritual': return 'default';
      case 'financeiro': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'saude': return 'Saúde';
      case 'familia': return 'Família';
      case 'trabalho': return 'Trabalho';
      case 'espiritual': return 'Espiritual';
      case 'financeiro': return 'Financeiro';
      default: return 'Geral';
    }
  };

  const RequestCard = ({ request, isExpanded, onToggle }: { 
    request: SecurePrayerRequest; 
    isExpanded: boolean; 
    onToggle: () => void; 
  }) => {
    const currentContactInfo = contactInfo[request.id];
    
    // Load contact info when card is expanded
    useEffect(() => {
      if (isExpanded && request.has_contact_info && !currentContactInfo) {
        loadContactInfo(request.id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded, request.has_contact_info, currentContactInfo, request.id]);

    return (
      <Card className="mb-3 sm:mb-4">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center flex-wrap gap-2">
                <Badge variant={getCategoryColor(request.category || 'geral')} className="text-xs">
                  {getCategoryName(request.category || 'geral')}
                </Badge>
                {request.is_urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgente
                  </Badge>
                )}
                {request.has_contact_info && (
                  <Badge variant="outline" className="text-xs">
                    📞 Contato
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!request.is_approved && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    >
                      <Check className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Aprovar</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleReject(request.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <X className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Rejeitar</span>
                    </Button>
                  </>
                )}
                {request.is_approved && !request.is_completed && (
                  <>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleComplete(request.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <CheckCircle className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Concluído</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleReject(request.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  </>
                )}
                {request.is_completed && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleReject(request.id)}
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Excluir</span>
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onToggle}
                  className="flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="font-semibold text-sm sm:text-base">{request.name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isExpanded ? request.request_text : `${request.request_text.substring(0, 100)}...`}
              </p>
            </div>

            {isExpanded && (
              <div className="space-y-3 pt-3 border-t">
                {request.has_contact_info && (
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium text-xs sm:text-sm mb-2 flex items-center">
                      <Shield className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                      Informações de Contato (Criptografadas)
                    </h4>
                    {currentContactInfo ? (
                      <>
                        {currentContactInfo.email && (
                          <p className="text-xs sm:text-sm"><strong>Email:</strong> {currentContactInfo.email}</p>
                        )}
                        {currentContactInfo.phone && (
                          <p className="text-xs sm:text-sm"><strong>Telefone:</strong> {currentContactInfo.phone}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">Carregando informações de contato...</p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-muted-foreground">
                  <span>Criado: {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  {request.approved_at && (
                    <span>Aprovado: {format(new Date(request.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  )}
                  {request.completed_at && (
                    <span>Concluído: {format(new Date(request.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const pendingRequests = requests.filter(req => !req.is_approved);
  const approvedRequests = requests.filter(req => req.is_approved && !req.is_completed);
  const completedRequests = requests.filter(req => req.is_completed);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Gerenciar Pedidos de Oração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Carregando pedidos de oração...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Gerenciar Pedidos de Oração
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Contatos Criptografados
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="pending" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden xs:inline">Pendentes</span>
              <span className="xs:hidden">({pendingRequests.length})</span>
              <span className="hidden xs:inline">({pendingRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Check className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden xs:inline">Aprovados</span>
              <span className="xs:hidden">({approvedRequests.length})</span>
              <span className="hidden xs:inline">({approvedRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden xs:inline">Concluídos</span>
              <span className="xs:hidden">({completedRequests.length})</span>
              <span className="hidden xs:inline">({completedRequests.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 sm:mt-6">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Eye className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum pedido pendente</h3>
                <p className="text-sm text-muted-foreground">Todos os pedidos foram revisados.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isExpanded={expandedRequest === request.id}
                    onToggle={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4 sm:mt-6">
            {approvedRequests.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Check className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum pedido aprovado</h3>
                <p className="text-sm text-muted-foreground">Pedidos aprovados aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {approvedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isExpanded={expandedRequest === request.id}
                    onToggle={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 sm:mt-6">
            {completedRequests.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CheckCircle className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum pedido concluído</h3>
                <p className="text-sm text-muted-foreground">Pedidos concluídos aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {completedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isExpanded={expandedRequest === request.id}
                    onToggle={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}