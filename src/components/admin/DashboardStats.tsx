/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Heart, 
  Calendar, 
  Radio, 
  Camera, 
  Users, 
  TrendingUp, 
  Activity,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from "@/lib/fetcher";

interface DashboardStats {
  totalTestimonies: number;
  approvedTestimonies: number;
  totalPrayerRequests: number;
  pendingPrayerRequests: number;
  totalEvents: number;
  upcomingEvents: number;
  totalStreams: number;
  liveStreams: number;
  totalPhotos: number;
  publishedPhotos: number;
}

interface ChartData {
  name: string;
  testimonies: number;
  prayers: number;
  events: number;
}

interface ActivityData {
  id: string;
  type: 'testimony' | 'prayer' | 'event' | 'stream';
  title: string;
  created_at: string;
  status?: string;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTestimonies: 0,
    approvedTestimonies: 0,
    totalPrayerRequests: 0,
    pendingPrayerRequests: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalStreams: 0,
    liveStreams: 0,
    totalPhotos: 0,
    publishedPhotos: 0,
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all statistics in parallel
      const data = await api<{
        testimonies: { id: string; name: string; is_approved: boolean; created_at: string }[];
        prayers: { id: string; name: string; is_approved: boolean; created_at: string }[];
        events: { id: string; title: string; event_date: string; is_published: boolean; created_at: string }[];
        streams: { id: string; title: string; is_live: boolean; is_active: boolean; created_at: string }[];
        photos: { id: string; is_published: boolean; created_at: string }[];
      }>("/api/admin/stats");

      const testimonies = data.testimonies;
      const prayers = data.prayers;
      const events = data.events;
      const streams = data.streams;
      const photos = data.photos;

      const now = new Date();

      setStats({
        totalTestimonies: testimonies.length,
        approvedTestimonies: testimonies.filter(t => t.is_approved).length,
        totalPrayerRequests: prayers.length,
        pendingPrayerRequests: prayers.filter(p => !p.is_approved).length,
        totalEvents: events.length,
        upcomingEvents: events.filter(e => new Date(e.event_date) > now && e.is_published).length,
        totalStreams: streams.length,
        liveStreams: streams.filter(s => s.is_live).length,
        totalPhotos: photos.length,
        publishedPhotos: photos.filter(p => p.is_published).length,
      });

      // Generate chart data for last 6 months
      generateChartData(testimonies, prayers, events);
      
      // Generate recent activity
      generateRecentActivity(testimonies, prayers, events, streams);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (testimonies: any[], prayers: any[], events: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTestimonies = testimonies.filter(t => {
        const created = new Date(t.created_at);
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      }).length;
      
      const monthPrayers = prayers.filter(p => {
        const created = new Date(p.created_at);
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      }).length;
      
      const monthEvents = events.filter(e => {
        const created = new Date(e.created_at);
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      }).length;

      months.push({
        name: monthName,
        testimonies: monthTestimonies,
        prayers: monthPrayers,
        events: monthEvents,
      });
    }
    
    setChartData(months);
  };

  const generateRecentActivity = (testimonies: any[], prayers: any[], events: any[], streams: any[]) => {
    const activities: ActivityData[] = [];

    // Add recent testimonies
    testimonies.slice(-3).forEach(t => {
      activities.push({
        id: t.id,
        type: 'testimony',
        title: 'Novo testemunho recebido',
        created_at: t.created_at,
        status: t.is_approved ? 'approved' : 'pending'
      });
    });

    // Add recent prayer requests
    prayers.slice(-3).forEach(p => {
      activities.push({
        id: p.id,
        type: 'prayer',
        title: 'Novo pedido de oração',
        created_at: p.created_at,
        status: p.is_approved ? 'approved' : 'pending'
      });
    });

    // Add recent events
    events.slice(-2).forEach(e => {
      activities.push({
        id: e.id,
        type: 'event',
        title: 'Novo evento criado',
        created_at: e.created_at,
        status: e.is_published ? 'published' : 'draft'
      });
    });

    // Add recent streams
    streams.slice(-2).forEach(s => {
      activities.push({
        id: s.id,
        type: 'stream',
        title: 'Nova transmissão configurada',
        created_at: s.created_at,
        status: s.is_active ? 'active' : 'inactive'
      });
    });

    // Sort by creation date and take the most recent
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'testimony': return <MessageCircle className="w-4 h-4" />;
      case 'prayer': return <Heart className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'stream': return <Radio className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'published':
      case 'active':
        return <Badge variant="default" className="text-xs">Ativo</Badge>;
      case 'pending':
      case 'draft':
      case 'inactive':
        return <Badge variant="secondary" className="text-xs">Pendente</Badge>;
      default:
        return null;
    }
  };

  // Criar dados do gráfico pizza com validações
  const pieData = [
    { name: 'Testemunhos', value: Math.max(stats.totalTestimonies, 0), color: '#8884d8' },
    { name: 'Orações', value: Math.max(stats.totalPrayerRequests, 0), color: '#82ca9d' },
    { name: 'Eventos', value: Math.max(stats.totalEvents, 0), color: '#ffc658' },
    { name: 'Fotos', value: Math.max(stats.totalPhotos, 0), color: '#ff7c7c' },
  ].filter(item => item.value > 0); // Remove itens com valor 0

  const hasAnyData = pieData.some(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards with Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testemunhos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <MessageCircle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalTestimonies}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.approvedTestimonies / Math.max(stats.totalTestimonies, 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {stats.approvedTestimonies} aprovados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos de Oração</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <Heart className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalPrayerRequests}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats.pendingPrayerRequests > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {stats.pendingPrayerRequests} pendentes
                </span>
              )}
              {stats.pendingPrayerRequests === 0 && (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Tudo aprovado
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats.upcomingEvents > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  {stats.upcomingEvents} próximos
                </>
              ) : (
                <span className="text-muted-foreground">Nenhum próximo</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transmissões</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Radio className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalStreams}</div>
            <p className="text-xs text-muted-foreground">
              {stats.liveStreams > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse" />
                  {stats.liveStreams} ao vivo
                </span>
              ) : (
                <span className="text-muted-foreground">Nenhuma ativa</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Atividade dos Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} labelStyle={{ color: "hsl(var(--popover-foreground))" }} itemStyle={{ color: "hsl(var(--popover-foreground))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="testimonies" stroke="#8884d8" name="Testemunhos" strokeWidth={2} />
                  <Line type="monotone" dataKey="prayers" stroke="#82ca9d" name="Orações" strokeWidth={2} />
                  <Line type="monotone" dataKey="events" stroke="#ffc658" name="Eventos" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Sem dados de atividade ainda</p>
                  <p className="text-sm text-muted-foreground">Os dados aparecerão quando houver conteúdo</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Distribuição de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAnyData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} labelStyle={{ color: "hsl(var(--popover-foreground))" }} itemStyle={{ color: "hsl(var(--popover-foreground))" }} formatter={(value) => [`${value} itens`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ainda não há conteúdo</p>
                  <p className="text-sm text-muted-foreground">Comece criando testemunhos, eventos ou fotos</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente encontrada
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Status Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Transmissões Ativas</span>
              <Badge variant={stats.liveStreams > 0 ? "default" : "secondary"}>
                {stats.liveStreams > 0 ? "Ao Vivo" : "Offline"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Pedidos Pendentes</span>
              <Badge variant={stats.pendingPrayerRequests > 5 ? "destructive" : "secondary"}>
                {stats.pendingPrayerRequests}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Eventos Próximos</span>
              <Badge variant={stats.upcomingEvents > 0 ? "default" : "outline"}>
                {stats.upcomingEvents}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Fotos Publicadas</span>
              <Badge variant="outline">
                {Math.round((stats.publishedPhotos / Math.max(stats.totalPhotos, 1)) * 100)}%
              </Badge>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;